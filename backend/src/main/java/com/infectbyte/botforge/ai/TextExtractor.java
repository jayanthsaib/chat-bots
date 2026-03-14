package com.infectbyte.botforge.ai;

import com.microsoft.playwright.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

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
