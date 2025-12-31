/*!
 * © [2025] Malith-Rukshan. All rights reserved.
 * Repository: https://github.com/Malith-Rukshan/Auto-Reaction-Bot
 * Modified: Multiple random reactions per post
 */

import { startMessage, donateMessage } from './constants.js';
import {
    MIN_REACTIONS,
    MAX_REACTIONS,
    MIN_DELAY,
    MAX_DELAY
} from './constants.js';
import { getRandomPositiveReaction } from './helper.js';

/* ------------------ Helpers ------------------ */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMultipleReactions(botApi, chatId, message_id, Reactions) {
    const reactionCount =
        Math.floor(Math.random() * (MAX_REACTIONS - MIN_REACTIONS + 1)) + MIN_REACTIONS;

    const shuffled = [...Reactions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, reactionCount);

    for (const emoji of selected) {
        try {
            await botApi.setMessageReaction(chatId, message_id, emoji);

            const delay =
                Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
            await sleep(delay);

        } catch (err) {
            console.error(`Reaction failed for ${emoji}`, err.message);
        }
    }
}

/* ------------------ Main Update Handler ------------------ */

export async function onUpdate(data, botApi, Reactions, RestrictedChats, botUsername, RandomLevel) {
    let chatId, message_id, text;

    if (data.message || data.channel_post) {
        const content = data.message || data.channel_post;
        chatId = content.chat.id;
        message_id = content.message_id;
        text = content.text;

        /* ---------- Commands ---------- */

        if (data.message && (text === '/start' || text === '/start@' + botUsername)) {
            await botApi.sendMessage(
                chatId,
                startMessage.replace(
                    'UserName',
                    content.chat.type === "private"
                        ? content.from.first_name
                        : content.chat.title
                ),
                [
                    [
                        { text: "➕ Add to Channel ➕", url: `https://t.me/${botUsername}?startchannel=botstart` },
                        { text: "➕ Add to Group ➕", url: `https://t.me/${botUsername}?startgroup=botstart` }
                    ],
                    [
                        { text: "Github Source 📥", url: "https://github.com/Malith-Rukshan/Auto-Reaction-Bot" }
                    ],
                    [
                        { text: "💝 Support Us - Donate 🤝", url: "https://t.me/Auto_ReactionBOT?start=donate" }
                    ]
                ]
            );

        } else if (data.message && text === '/reactions') {
            const reactions = Reactions.join(", ");
            await botApi.sendMessage(chatId, "✅ Enabled Reactions : \n\n" + reactions);

        } else if (data.message && (text === '/donate' || text === '/start donate')) {
            await botApi.sendInvoice(
                chatId,
                "Donate to Auto Reaction Bot ✨",
                donateMessage,
                '{}',
                '',
                'donate',
                'XTR',
                [{ label: 'Pay ⭐️5', amount: 5 }]
            );

        } else {
            /* ---------- Auto Reaction Logic ---------- */

            if (!RestrictedChats.includes(chatId)) {
                const threshold = 1 - (RandomLevel / 10);

                // GROUP / SUPERGROUP → random chance
                if (["group", "supergroup"].includes(content.chat.type)) {
                    if (Math.random() <= threshold) {
                        await sendMultipleReactions(botApi, chatId, message_id, Reactions);
                    }
                }
                // CHANNELS & PRIVATE → always react
                else {
                    await sendMultipleReactions(botApi, chatId, message_id, Reactions);
                }
            }
        }

    } else if (data.pre_checkout_query) {
        await botApi.answerPreCheckoutQuery(data.pre_checkout_query.id, true);
        await botApi.sendMessage(
            data.pre_checkout_query.from.id,
            "Thank you for your donation! 💝"
        );
    }
}
