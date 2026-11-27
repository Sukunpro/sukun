package tr.sukun.cevrimdisi;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ServiceWorkerWebSettings;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;

public final class MainActivity extends Activity {
    private static final int PICK_FILES = 21, SAVE_FILE = 22, MICROPHONE = 23;
    private static final int BACKGROUND = Color.rgb(6, 25, 22);
    private static final Uri OPEN_WEB_AI = Uri.parse(LocalContent.ORIGIN + "/sukun/open-online-ai");
    private static final Uri WEB_AI = Uri.parse("https://sukunpro.github.io/sukun/#sukun-ai");
    private FrameLayout screen;
    private WebView page;
    private LocalContent local;
    private ExportChannel exports;
    private ServiceWorkerController workerController;
    private View fullScreen;
    private WebChromeClient.CustomViewCallback fullScreenCallback;
    private ValueCallback<Uri[]> picker;
    private PermissionRequest microphone;
    // Kept in a separate class to avoid resolving Android 13 types on older devices.
    private ModernBack modernBack;

    @android.annotation.TargetApi(33)
    private static final class ModernBack {
        private final android.window.OnBackInvokedDispatcher dispatcher;
        private final android.window.OnBackInvokedCallback callback;
        private boolean registered;

        ModernBack(MainActivity activity) {
            dispatcher = activity.getOnBackInvokedDispatcher();
            callback = () -> {
                if (!activity.consumeAppBack()) activity.finishAfterTransition();
                activity.updateBackHandling();
            };
        }

        void setEnabled(boolean enabled) {
            if (enabled == registered) return;
            if (enabled) {
                dispatcher.registerOnBackInvokedCallback(
                        android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, callback);
            } else {
                dispatcher.unregisterOnBackInvokedCallback(callback);
            }
            registered = enabled;
        }
    }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        getWindow().setStatusBarColor(BACKGROUND);
        getWindow().setNavigationBarColor(BACKGROUND);
        try {
            local = new LocalContent(getApplicationInfo().sourceDir);
            page = new WebView(this);
        } catch (IOException | RuntimeException e) {
            new AlertDialog.Builder(this).setTitle("Sükûn açılamadı")
                    .setMessage("Android System WebView’i ve uygulamanın kurulumunu kontrol edip yeniden aç.")
                    .setPositiveButton("Kapat", (d, which) -> finish()).setOnCancelListener(d -> finish()).show();
            return;
        }
        screen = new FrameLayout(this);
        screen.setBackgroundColor(BACKGROUND);
        screen.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        page.setBackgroundColor(BACKGROUND);
        screen.addView(page, new FrameLayout.LayoutParams(-1, -1));
        setContentView(screen);
        WebSettings settings = page.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setBlockNetworkLoads(true);
        // The bundled player owns the intro preference, user start/stop and the next clip in a journey.
        // Microphone access is handled independently by the origin and OS permission checks below.
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(page, false);
        exports = new ExportChannel(this);
        page.setWebViewClient(new LocalClient());
        page.setWebChromeClient(new BrowserChrome());
        // APK assets are also authoritative for any workers used by release tools.
        try {
            final LocalContent content = local;
            ServiceWorkerController controller = ServiceWorkerController.getInstance();
            ServiceWorkerWebSettings workerSettings = controller.getServiceWorkerWebSettings();
            workerSettings.setAllowContentAccess(false);
            workerSettings.setAllowFileAccess(false);
            workerSettings.setBlockNetworkLoads(true);
            controller.setServiceWorkerClient(new ServiceWorkerClient() {
                @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return content.intercept(request);
                }
            });
            workerController = controller;
        } catch (UnsupportedOperationException ignored) {
            // WebView providers without worker support still run the packaged app.
        }
        // The application restores its own settings, counters, voices and journey.
        // A real process restart starts a fresh WebView document on the same origin.
        if (Build.VERSION.SDK_INT >= 33) modernBack = new ModernBack(this);
        page.loadUrl(LocalContent.START);
    }

    private final class LocalClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return local.intercept(request);
        }
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (OPEN_WEB_AI.equals(request.getUrl())) {
                if (request.isForMainFrame() && request.hasGesture() && trustedPage()) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, WEB_AI).addCategory(Intent.CATEGORY_BROWSABLE));
                    } catch (ActivityNotFoundException e) {
                        toast("Web tarayıcısı açılamadı.");
                    }
                }
                return true;
            }
            if (LocalContent.inApp(request.getUrl())) return false;
            if (request.isForMainFrame()) toast("Bu bağlantı çevrimdışı paketin dışında.");
            return true;
        }
        @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            exports.disconnected();
        }
        @Override public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
            super.doUpdateVisitedHistory(view, url, isReload);
            updateBackHandling();
        }
        @Override public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            updateBackHandling();
            if (url != null && url.equals(view.getUrl()) && LocalContent.inApp(Uri.parse(url))) exports.connect(view);
        }
    }

    private final class BrowserChrome extends WebChromeClient {
        @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> result, FileChooserParams params) {
            // Only a single native document picker can be active at a time.
            if (picker != null || !trustedPage()) { result.onReceiveValue(null); return true; }
            picker = result;
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE);
            LinkedHashSet<String> types = new LinkedHashSet<>();
            for (String group : params.getAcceptTypes()) {
                if (group == null) continue;
                for (String item : group.split(",")) if (item.trim().contains("/")) types.add(item.trim());
            }
            intent.setType(types.size() == 1 ? types.iterator().next() : "*/*");
            if (types.size() > 1) intent.putExtra(Intent.EXTRA_MIME_TYPES, types.toArray(new String[0]));
            if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
            try { startActivityForResult(intent, PICK_FILES); }
            catch (ActivityNotFoundException e) { picker = null; result.onReceiveValue(null); toast("Dosya seçici açılamadı."); }
            return true;
        }

        @Override public void onPermissionRequest(PermissionRequest request) {
            if (!trustedPage() || !LocalContent.sameOrigin(request.getOrigin()) || microphone != null
                    || !Arrays.asList(request.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                request.deny();
                return;
            }
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
            } else {
                microphone = request;
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MICROPHONE);
            }
        }
        @Override public void onPermissionRequestCanceled(PermissionRequest request) {
            if (microphone == request) microphone = null;
        }

        @Override public void onShowCustomView(View view, CustomViewCallback callback) {
            if (fullScreen != null) { callback.onCustomViewHidden(); return; }
            fullScreen = view;
            fullScreenCallback = callback;
            page.setVisibility(View.GONE);
            screen.addView(view, new FrameLayout.LayoutParams(-1, -1));
            updateBackHandling();
        }
        @Override public void onHideCustomView() { exitFullscreen(); }
    }

    private boolean trustedPage() {
        String url = page == null ? null : page.getUrl();
        return url != null && LocalContent.inApp(Uri.parse(url));
    }

    private void exitFullscreen() {
        if (fullScreen == null) return;
        screen.removeView(fullScreen);
        fullScreen = null;
        page.setVisibility(View.VISIBLE);
        WebChromeClient.CustomViewCallback cb = fullScreenCallback;
        fullScreenCallback = null;
        if (cb != null) cb.onCustomViewHidden();
        updateBackHandling();
    }

    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code != MICROPHONE || microphone == null) return;
        PermissionRequest request = microphone;
        microphone = null;
        if (trustedPage() && LocalContent.sameOrigin(request.getOrigin()) && results.length == 1
                && results[0] == PackageManager.PERMISSION_GRANTED)
            request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        else request.deny();
    }

    boolean chooseDestination(String name, String mime) {
        if (isFinishing() || isDestroyed()) return false;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                .setType(mime).putExtra(Intent.EXTRA_TITLE, name);
        try { startActivityForResult(intent, SAVE_FILE); return true; }
        catch (ActivityNotFoundException e) { toast("Dosya kaydetme ekranı açılamadı."); return false; }
    }

    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == SAVE_FILE && exports != null) {
            Uri destination = result == RESULT_OK && data != null ? data.getData() : null;
            exports.destination(isContent(destination) ? destination : null);
        }
        if (code != PICK_FILES || picker == null) return;
        ValueCallback<Uri[]> current = picker;
        picker = null;
        ArrayList<Uri> uris = new ArrayList<>();
        if (result == RESULT_OK && data != null) {
            ClipData clips = data.getClipData();
            if (clips != null) {
                for (int i = 0; i < clips.getItemCount(); i++) {
                    Uri uri = clips.getItemAt(i).getUri();
                    if (isContent(uri)) uris.add(uri);
                }
            } else if (isContent(data.getData())) uris.add(data.getData());
        }
        current.onReceiveValue(uris.isEmpty() ? null : uris.toArray(new Uri[0]));
    }

    private static boolean isContent(Uri uri) {
        return uri != null && "content".equals(uri.getScheme()) && uri.getAuthority() != null;
    }

    private void toast(String msg) { Toast.makeText(this, msg, Toast.LENGTH_SHORT).show(); }

    private void updateBackHandling() {
        if (modernBack != null) modernBack.setEnabled(fullScreen != null || (page != null && page.canGoBack()));
    }

    private boolean consumeAppBack() {
        if (fullScreen != null) { exitFullscreen(); return true; }
        if (page != null && page.canGoBack()) { page.goBack(); return true; }
        return false;
    }

    @Override public void onBackPressed() {
        if (!consumeAppBack()) super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (modernBack != null) modernBack.setEnabled(false);
        if (picker != null) { picker.onReceiveValue(null); picker = null; }
        if (microphone != null) { microphone.deny(); microphone = null; }
        if (exports != null) exports.close();
        if (page != null) {
            if (workerController != null) workerController.setServiceWorkerClient(null);
            if (page.getParent() instanceof ViewGroup) ((ViewGroup) page.getParent()).removeView(page);
            page.destroy();
        }
        if (local != null) try { local.close(); } catch (IOException ignored) { }
        super.onDestroy();
    }
}
