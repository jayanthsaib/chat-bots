package com.infectbyte.botforge.ai;

import com.microsoft.playwright.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.*;

@Component
@Slf4j
public class TextExtractor {

    public String extractFromPdf(InputStream inputStream) throws IOException {
        try (PDDocument doc = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    public String extractFromUrl(String url) throws IOException {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 BotForge-Crawler/1.0")
                    .timeout(10_000)
                    .get();
            doc.select("nav, header, footer, script, style, [class*=nav], [class*=menu]").remove();
            String text = extractStructuredText(doc);
            log.info("Jsoup extracted {} chars from {}", text.length(), url);
            if (text.length() > 200) return text;
            log.info("Jsoup returned little content for {}, trying Playwright", url);
        } catch (Exception e) {
            log.warn("Jsoup failed for {}: {}, trying Playwright", url, e.getMessage());
        }
        return extractWithPlaywright(url);
    }

    private String extractStructuredText(Document doc) {
        StringBuilder sb = new StringBuilder();
        for (org.jsoup.nodes.Element el : doc.body().select("h1,h2,h3,h4,h5,h6,p,li,td,th,blockquote,section,article")) {
            String text = el.ownText().trim();
            if (!text.isEmpty()) sb.append(text).append("\n\n");
        }
        String result = sb.toString().trim();
        return result.isEmpty() ? doc.body().text() : result;
    }

    private String extractWithPlaywright(String url) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions().setHeadless(true)
            );
            Page page = browser.newPage();
            page.navigate(url, new Page.NavigateOptions().setTimeout(20_000));
            page.waitForLoadState(com.microsoft.playwright.options.LoadState.NETWORKIDLE,
                    new Page.WaitForLoadStateOptions().setTimeout(15_000));
            String html = page.content();
            browser.close();
            Document doc = Jsoup.parse(html);
            doc.select("nav, header, footer, script, style, [class*=nav], [class*=menu]").remove();
            return extractStructuredText(doc);
        } catch (Exception e) {
            log.error("Playwright failed for {}: {}", url, e.getMessage());
            throw new RuntimeException("Failed to extract content from URL: " + e.getMessage());
        }
    }

    public String crawlWebsite(String startUrl, int maxPages) throws IOException {
        String baseOrigin;
        try {
            URI base = new URI(startUrl).normalize();
            baseOrigin = base.getScheme() + "://" + base.getHost()
                    + (base.getPort() != -1 ? ":" + base.getPort() : "");
        } catch (Exception e) {
            throw new IOException("Invalid URL: " + startUrl);
        }

        Set<String> visited = new LinkedHashSet<>();
        Queue<String> queue = new ArrayDeque<>();
        queue.add(startUrl);

        StringBuilder combined = new StringBuilder();
        int pages = 0;

        // Single Playwright browser session — renders JS so SPA links are visible
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(
                    new BrowserType.LaunchOptions().setHeadless(true));
            Page page = browser.newPage();

            while (!queue.isEmpty() && pages < maxPages) {
                String url = queue.poll();
                if (visited.contains(url)) continue;
                visited.add(url);

                log.info("Crawling page {}/{}: {}", pages + 1, maxPages, url);
                try {
                    page.navigate(url, new Page.NavigateOptions().setTimeout(20_000));
                    page.waitForLoadState(com.microsoft.playwright.options.LoadState.NETWORKIDLE,
                            new Page.WaitForLoadStateOptions().setTimeout(15_000));
                    // Extra wait for API-driven SPAs to finish rendering data
                    page.waitForTimeout(2000);

                    // Extract content from fully-rendered DOM
                    String html = page.content();
                    Document doc = Jsoup.parse(html);
                    doc.select("nav, header, footer, script, style, [class*=nav], [class*=menu]").remove();
                    String text = extractStructuredText(doc);

                    // Log a snippet to diagnose empty pages
                    String bodyText = Jsoup.parse(page.content()).body().text();
                    log.info("Extracted {} chars (body:{} chars) from {}",
                        text == null ? 0 : text.length(), bodyText.length(), url);
                    if (bodyText.length() > 0 && (text == null || text.isBlank())) {
                        log.debug("Body snippet for {}: {}", url, bodyText.substring(0, Math.min(200, bodyText.length())));
                    }
                    if (text != null && !text.isBlank()) {
                        combined.append("=== ").append(url).append(" ===\n")
                                .append(text).append("\n\n");
                        pages++;
                    }

                    // Discover links from fully-rendered DOM (catches SPA router links)
                    if (pages < maxPages) {
                        // Re-parse full HTML (before nav removal) to get links
                        Document fullDoc = Jsoup.parse(page.content());
                        for (Element link : fullDoc.select("a[href]")) {
                            String href = link.attr("abs:href");
                            if (href.isBlank()) href = link.attr("href");
                            if (href.isBlank() || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
                            try {
                                // Resolve relative URLs against current page
                                URI linkUri = new URI(url).resolve(href).normalize();
                                String linkOrigin = linkUri.getScheme() + "://" + linkUri.getHost()
                                        + (linkUri.getPort() != -1 ? ":" + linkUri.getPort() : "");
                                if (!linkOrigin.equals(baseOrigin)) continue;
                                String clean = linkOrigin + linkUri.getPath();
                                if (!clean.isBlank() && !visited.contains(clean)
                                        && !clean.matches(".*\\.(jpg|jpeg|png|gif|svg|ico|css|js|pdf|zip|xml|json|woff|woff2|ttf)$")) {
                                    queue.add(clean);
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to crawl {}: {}", url, e.getMessage());
                }
            }
            browser.close();
        }

        log.info("Crawled {} pages from {}", pages, startUrl);
        return combined.toString();
    }

    public String sanitizeText(String text) {
        if (text == null) return "";
        return text
                .replaceAll("\r\n", "\n")
                .replaceAll("\r", "\n")
                .replaceAll("[ \t]+", " ")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }
}
