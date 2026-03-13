package com.infectbyte.botforge.api.knowledge;

import java.util.List;

public record FaqRequest(String title, List<FaqItem> faqs) {
    public record FaqItem(String question, String answer) {}
}
