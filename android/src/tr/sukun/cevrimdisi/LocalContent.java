package tr.sukun.cevrimdisi;

import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.Closeable;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Serves only the web release embedded in this application's base APK. */
final class LocalContent implements Closeable {
    static final String HOST = "appassets.androidplatform.net";
    static final String ORIGIN = "https://" + HOST;
    static final String START = ORIGIN + "/sukun/nero.html";
    private static final String PREFIX = "/sukun/";
    private static final Pattern RANGE = Pattern.compile("bytes=([0-9]*)-([0-9]*)", Pattern.CASE_INSENSITIVE);
    private static final byte[] EMPTY = new byte[0];
    private final ZipFile apk;

    LocalContent(String apkPath) throws IOException { apk = new ZipFile(apkPath); }
    @Override public void close() throws IOException { apk.close(); }

    static boolean sameOrigin(Uri uri) {
        return uri != null && "https".equals(uri.getScheme()) && HOST.equalsIgnoreCase(uri.getEncodedAuthority());
    }

    static boolean inApp(Uri uri) { return path(uri) != null; }

    private static String path(Uri uri) {
        if (!sameOrigin(uri)) return null;
        String requested = uri.getPath();
        if (requested == null || !requested.startsWith(PREFIX) || requested.indexOf('\\') >= 0
                || requested.indexOf('\0') >= 0) return null;
        String name = requested.substring(PREFIX.length());
        if (name.isEmpty()) name = "nero.html";
        for (String segment : name.split("/", -1)) {
            if (segment.isEmpty() || ".".equals(segment) || "..".equals(segment)) return null;
        }
        return "assets/sukun/" + name;
    }

    private static String header(Map<String, String> headers, String name) {
        for (Map.Entry<String,String> header : headers.entrySet()) {
            if (name.equalsIgnoreCase(header.getKey())) return header.getValue();
        }
        return null;
    }

    static long[] byteRange(String value, long size) {
        Matcher range = RANGE.matcher(value.trim());
        if (!range.matches() || size == 0) return null;
        String start = range.group(1), end = range.group(2);
        try {
            if (start.isEmpty()) {
                if (end.isEmpty()) return null;
                long count = Long.parseLong(end);
                return count == 0 ? null : new long[]{Math.max(0, size - count), size - 1};
            }
            long first = Long.parseLong(start);
            long last = end.isEmpty() ? size - 1 : Math.min(Long.parseLong(end), size - 1);
            return first >= size || first > last ? null : new long[]{first, last};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    WebResourceResponse intercept(WebResourceRequest request) {
        Uri uri = request.getUrl();
        // Chromium owns data/blob objects created by trusted Sükûn content.
        if (("data".equals(uri.getScheme()) || "blob".equals(uri.getScheme())) && !request.isForMainFrame()) return null;
        String asset = path(uri);
        if (asset == null) return error(403, "Forbidden", null);
        boolean head = "HEAD".equals(request.getMethod());
        if (!head && !"GET".equals(request.getMethod())) return error(405, "Method Not Allowed", null);
        try {
            ZipEntry entry = apk.getEntry(asset);
            if (entry == null || entry.isDirectory()) return error(404, "Not Found", null);
            long size = entry.getSize();
            String desiredRange = header(request.getRequestHeaders(), "Range");
            long[] bytes = desiredRange == null ? new long[]{0, size - 1} : byteRange(desiredRange, size);
            if (bytes == null) return error(416, "Range Not Satisfiable", "bytes */" + size);
            long length = bytes[1] - bytes[0] + 1;
            String type = mime(asset);
            Map<String,String> headers = new HashMap<>();
            headers.put("Accept-Ranges", "bytes");
            headers.put("Content-Length", Long.toString(length));
            headers.put("Cache-Control", "no-cache");
            headers.put("X-Content-Type-Options", "nosniff");
            if (desiredRange != null) headers.put("Content-Range", "bytes " + bytes[0] + "-" + bytes[1] + "/" + size);
            String encoding = type.startsWith("text/") || type.contains("json") || type.equals("image/svg+xml") ? "UTF-8" : null;
            InputStream body = head ? new ByteArrayInputStream(EMPTY) : stream(entry, bytes[0], length);
            return new WebResourceResponse(type, encoding, desiredRange == null ? 200 : 206,
                    desiredRange == null ? "OK" : "Partial Content", headers, body);
        } catch (IOException | IllegalStateException e) {
            return error(503, "Service Unavailable", null);
        }
    }

    private InputStream stream(ZipEntry entry, long offset, long size) throws IOException {
        InputStream in = apk.getInputStream(entry);
        try {
            while (offset > 0) {
                long skipped = in.skip(offset);
                if (skipped == 0) {
                    if (in.read() < 0) throw new IOException("Unexpected end of asset");
                    skipped = 1;
                }
                offset -= skipped;
            }
            return new Slice(in, size);
        } catch (IOException e) {
            in.close();
            throw e;
        }
    }

    private static WebResourceResponse error(int code, String reason, String range) {
        Map<String,String> headers = new HashMap<>();
        headers.put("Content-Length", "0");
        if (range != null) headers.put("Content-Range", range);
        if (code == 405) headers.put("Allow", "GET, HEAD");
        return new WebResourceResponse("text/plain", "UTF-8", code, reason, headers, new ByteArrayInputStream(EMPTY));
    }

    private static String mime(String filename) {
        int period = filename.lastIndexOf('.');
        String ext = period < 0 ? "" : filename.substring(period + 1).toLowerCase(Locale.ROOT);
        switch (ext) {
            case "html": return "text/html";
            case "css": return "text/css";
            case "js": case "mjs": return "text/javascript";
            case "json": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "webm": return "audio/webm";
            case "mp3": return "audio/mpeg";
            case "wav": return "audio/wav";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "webp": return "image/webp";
            case "txt": case "md": case "jsonc": return "text/plain";
            default: return "application/octet-stream";
        }
    }

    private static final class Slice extends FilterInputStream {
        private long remaining;
        Slice(InputStream stream, long remaining) { super(stream); this.remaining = remaining; }
        @Override public int read() throws IOException {
            if (remaining == 0) return -1;
            int value = super.read();
            if (value >= 0) remaining--;
            return value;
        }
        @Override public int read(byte[] b, int off, int len) throws IOException {
            if (len == 0) return 0;
            if (remaining == 0) return -1;
            int count = super.read(b, off, (int) Math.min(remaining, len));
            if (count > 0) remaining -= count;
            return count;
        }
        @Override public long skip(long n) throws IOException {
            long count = super.skip(Math.max(0, Math.min(n, remaining)));
            remaining -= count;
            return count;
        }
        @Override public int available() throws IOException { return (int) Math.min(remaining, super.available()); }
        @Override public boolean markSupported() { return false; }
        @Override public void reset() throws IOException { throw new IOException("Reset unsupported"); }
    }
}
