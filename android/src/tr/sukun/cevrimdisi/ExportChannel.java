package tr.sukun.cevrimdisi;

import android.net.Uri;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Base64;
import android.webkit.WebMessage;
import android.webkit.WebMessagePort;
import android.webkit.WebView;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

/** Bound only to the top-level HTTPS origin. The user chooses every external destination. */
final class ExportChannel {
    private static final int CHUNK = 96 * 1024;
    private static final long MAX_BYTES = 2L * 1024 * 1024 * 1024;
    private final MainActivity activity;
    private final HandlerThread worker = new HandlerThread("sukun-dosya");
    private final Handler io;
    private final File folder;
    private volatile WebMessagePort current;
    private WebMessagePort destinationOwner; // UI thread only

    // All staging state below is confined to the IO thread.
    private WebMessagePort owner;
    private String name, mime;
    private long expected, count;
    private File staging;
    private OutputStream output;

    ExportChannel(MainActivity activity) {
        this.activity = activity;
        folder = new File(activity.getCacheDir(), "sukun-exports");
        worker.start();
        io = new Handler(worker.getLooper());
        io.post(() -> {
            File[] abandoned = folder.listFiles();
            if (abandoned == null) return;
            long cutoff = System.currentTimeMillis() - 24L * 60 * 60 * 1000;
            for (File file : abandoned) if (file.getName().startsWith("save-") && file.lastModified() < cutoff) file.delete();
        });
    }

    void connect(WebView view) {
        if (current != null) return;
        WebMessagePort[] ports = view.createWebMessageChannel();
        current = ports[0];
        current.setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
            @Override public void onMessage(WebMessagePort source, WebMessage message) {
                if (source == current && message != null) handle(source, message.getData());
            }
        }, io);
        view.postWebMessage(new WebMessage("sukun-export-v1", new WebMessagePort[]{ports[1]}), Uri.parse(LocalContent.ORIGIN));
    }

    void disconnected() {
        WebMessagePort old = current;
        current = null;
        if (old != null) {
            old.close();
            io.post(() -> { if (owner == old) reset(); });
        }
    }

    void close() { disconnected(); worker.quitSafely(); }

    private void reply(WebMessagePort source, String type, String detail) {
        JSONObject packet = new JSONObject();
        try {
            packet.put("type", type);
            if (detail != null) packet.put("message", detail);
        } catch (JSONException ignored) { return; }
        activity.runOnUiThread(() -> {
            if (current == source) source.postMessage(new WebMessage(packet.toString()));
        });
    }

    private void fail(WebMessagePort source, String reason) {
        if (source == owner) reset();
        reply(source, "error", reason);
    }

    private void handle(WebMessagePort source, String raw) {
        if (raw == null || raw.length() > CHUNK / 3 * 4 + 1024) {
            fail(source, "Dosya parçası okunamadı.");
            return;
        }
        try {
            JSONObject message = new JSONObject(raw);
            String type = message.getString("type");
            if ("begin".equals(type)) {
                if (owner != null) { reply(source, "error", "Bir dosya zaten kaydediliyor."); return; }
                start(source, message);
            } else if (owner != source) {
                reply(source, "error", "Dosya kaydetme oturumu sona erdi.");
            } else if ("chunk".equals(type) && output != null) {
                byte[] data = Base64.decode(message.getString("data"), Base64.NO_WRAP);
                if (data.length < 1 || data.length > CHUNK || count + data.length > expected) throw new IOException("length");
                output.write(data);
                count += data.length;
                reply(source, "next", null);
            } else if ("finish".equals(type) && output != null && count == expected) {
                output.close();
                output = null;
                requestDestination(source, name, mime);
            } else if ("cancel".equals(type)) {
                reset();
                reply(source, "cancelled", null);
            } else {
                fail(source, "Kaydın bütünlüğü doğrulanamadı.");
            }
        } catch (JSONException | IOException | IllegalArgumentException e) {
            fail(source, "Dosya kaydedilemedi. Boş alanı kontrol edip tekrar dene.");
        }
    }

    private void start(WebMessagePort source, JSONObject message) throws IOException, JSONException {
        long size = message.getLong("bytes");
        if (!folder.isDirectory() && !folder.mkdirs()) throw new IOException("cache");
        if (size < 0 || size > MAX_BYTES || size > folder.getUsableSpace() - 4L * 1024 * 1024) {
            reply(source, "error", "Dışa aktarma için cihazda yeterli geçici alan yok veya dosya 2 GiB sınırını aşıyor.");
            return;
        }
        String title = message.optString("name", "Sukun-dosyasi").trim().replaceAll("[\\p{Cntrl}/\\\\]", "_");
        if (title.length() > 180) title = title.substring(0, 180);
        if (title.isEmpty() || ".".equals(title) || "..".equals(title)) title = "Sukun-dosyasi";
        String type = message.optString("mime", "application/octet-stream").split(";", 2)[0].trim();
        if (!type.matches("[a-zA-Z0-9+.-]+/[a-zA-Z0-9+.-]+")) type = "application/octet-stream";
        owner = source;
        name = title;
        mime = type;
        count = 0;
        expected = size;
        staging = File.createTempFile("save-", ".part", folder);
        output = new FileOutputStream(staging);
        reply(source, "ready", null);
    }

    private void requestDestination(WebMessagePort source, String title, String type) {
        activity.runOnUiThread(() -> {
            if (source != current) return;
            if (destinationOwner == null && activity.chooseDestination(title, type)) destinationOwner = source;
            else io.post(() -> fail(source, "Kaydetme ekranı açılamadı."));
        });
    }

    // The picker result belongs to the exact document that created the staged file.
    void destination(Uri selected) {
        WebMessagePort source = destinationOwner;
        destinationOwner = null;
        if (source == null) return;
        io.post(() -> {
            if (source != owner || source != current || staging == null || output != null) return;
            if (selected == null) { reset(); reply(source, "cancelled", null); return; }
            try (FileInputStream in = new FileInputStream(staging);
                 OutputStream out = activity.getContentResolver().openOutputStream(selected, "wt")) {
                if (out == null) throw new IOException("destination");
                byte[] buffer = new byte[128 * 1024];
                int n;
                while ((n = in.read(buffer)) >= 0) if (n > 0) out.write(buffer, 0, n);
                out.flush();
            } catch (IOException | SecurityException e) {
                fail(source, "Hedef dosyaya yazma tamamlanamadı. Başka bir konum dene.");
                return;
            }
            reset();
            reply(source, "done", null);
        });
    }

    private void reset() {
        if (output != null) try { output.close(); } catch (IOException ignored) { }
        if (staging != null) staging.delete();
        owner = null;
        staging = null;
        output = null;
        name = mime = null;
        count = expected = 0;
    }
}
