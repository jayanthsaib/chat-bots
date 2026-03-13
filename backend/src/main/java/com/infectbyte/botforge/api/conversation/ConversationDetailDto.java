package com.infectbyte.botforge.api.conversation;

import java.util.List;

public record ConversationDetailDto(ConversationDto conversation, List<MessageItemDto> messages) {}
