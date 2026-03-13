package com.infectbyte.botforge.ai;

import lombok.extern.slf4j.Slf4j;
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
        try (PDDocument doc = PDDocument.load(inputStream)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    public String extractFromUrl(String url) throws IOException {
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0 BotForge-Crawler/1.0")
                .timeout(10_000)
                .get();
        // Remove nav, header, footer, scripts
        doc.select("nav, header, footer, script, style, [class*=nav], [class*=menu]").remove();
        return doc.body().text();
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
