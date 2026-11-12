import "server-only";
import type { ParentRole } from "@/lib/roles";
import { getContentRow, type ContentJson } from "@/server/content-store";
import { INTRO_LETTER } from "./intro";
import type { CardDef, CardSection, LetterDef, ReviewStatus, RoomBodyView, RoomDef, RoomListItem, RoomPreludeView, PreludeStep } from "./types";

/**
 * Room registry. Prelude/entry sentences come verbatim from docs/03 and docs/04.
 * Card bodies are filled in stages 3-4 (null = 준비 중). Card bodies must only
 * ever be returned after the recording gate (stage 2) -- see getRoomPreludeView,
 * which deliberately excludes cards.
 */

export const EFFORT_HEADINGS = ["지금 하고 있는 일", "확인된 변화", "다음 계획"] as const;

const ROOMS: RoomDef[] = [
  {
    id: 1,
    title: "아직 화가 나요",
    summary: "지금 드는 마음을 그대로 적어둘 수 있어요.",
    requiresRecording: false,
    prelude: [],
    entryPhrase: null,
    cards: [],
  },
  {
    id: 2,
    title: "네 마음을 들어볼게",
    summary: "아들이 전하고 싶은 마음을 들어볼 수 있어요.",
    requiresRecording: true,
    prelude: [
      {
        kind: "text",
        id: "r2-1",
        paragraphs: ["이 방은 아들이 엄마와 아빠에게 자신의 마음을 전하고 싶어서 만든 공간이에요."],
        nextLabel: "다음",
      },
      {
        kind: "text",
        id: "r2-2",
        paragraphs: [
          "아들은 자신의 마음을 궁금해해 주시는 것이 감사해요.",
          "한편으로는 이야기를 꺼냈다가 다시 비난받을까 봐 두렵기도 해요.",
        ],
        nextLabel: "다음",
      },
      {
        kind: "choice",
        id: "r2-3",
        paragraphs: ["지금은 아들의 마음을 먼저 들어보고 싶으신가요?"],
        options: [
          { label: "네, 들어볼게요", action: "continue" },
          { label: "다음에 볼게요", action: "rooms" },
        ],
      },
    ],
    entryPhrase: "네 마음을 들어보고 싶어.",
    // Stage 3 drafts (1인칭 편지). Only facts confirmed in 00_REQUIREMENTS.md / 03 are used;
    // feelings are written as the son's feelings, parents' intentions are never asserted.
    // All are needs_review: parents see the generic 준비 중 message until the son approves each card.
    cards: [
      {
        id: "thanks",
        title: "고마웠던 마음",
        status: "needs_review",
        body: [
          "엄마, 아빠. 먼저 고맙다는 말부터 하고 싶어요.",
          "엄마 아빠는 저를 위해 큰돈을 증여해 주시고, 또 빌려주셨어요. 쉽게 내어주실 수 있는 돈이 아니라는 걸 알아요.",
          "그리고 지금처럼 마음이 무거우실 때에도 이 공간에 와서 제 이야기를 들어보려고 해 주셔서 고마워요.",
        ],
        reviewNote:
          "구체적인 고마운 기억을 한두 가지 직접 더해 주세요(지어내지 않으려고 비워 두었어요). 증여와 차용은 용도가 달라 금액을 합치거나 한 가지 용도로 묶지 않았어요.",
      },
      {
        id: "sorry",
        title: "미안했던 마음",
        status: "needs_review",
        body: [
          "파혼 소식으로 엄마 아빠를 많이 놀라게 하고 걱정을 끼쳐 드려 죄송해요.",
          "주변에 설명하셔야 할 일로도 마음이 많이 쓰이셨을 것 같아요.",
          "그 과정에서 제가 엄마 아빠의 마음을 충분히 헤아리지 못한 부분이 있었다면, 그것도 죄송해요.",
          "빌려주신 돈은 약속한 대로 책임지고 갚아 나갈게요.",
        ],
        reviewNote:
          "실제로 사과하고 싶은 말이나 행동이 있다면 무엇을, 언제 했는지 구체적으로 적어 주세요. 사과는 구체적일수록 전해져요. 파혼 자체를 잘못으로 사과하는 문장은 넣지 않았어요.",
      },
      {
        id: "breakup",
        title: "파혼을 겪던 마음",
        status: "needs_review",
        sections: [
          {
            heading: "있었던 일",
            paragraphs: ["2026년 6월 6일, 저는 파혼했어요.", "제가 알게 된 파혼의 이유는 상대방의 외도였어요."],
          },
          {
            heading: "제 마음",
            paragraphs: [
              "믿었던 사람과의 약속이 그렇게 끝나서, 한동안 무엇부터 정리해야 할지 몰랐어요.",
              "제가 부끄러운 일을 한 건 아니라고 생각하면서도, 엄마 아빠 얼굴을 뵙기가 어려웠어요.",
            ],
          },
        ],
        body: null,
        reviewNote: "‘제 마음’ 부분은 초안이에요. 실제로 느낀 마음과 다르면 고쳐 주세요. 상대방에 대한 다른 사실은 넣지 않았어요.",
      },
      {
        id: "words",
        title: "그날 들었던 말",
        status: "needs_review",
        sections: [
          {
            heading: "있었던 일",
            paragraphs: ["그날 저는 제 외모를 깎아내리는 말과, 제 여자친구를 향한 욕설을 들었어요."],
          },
          {
            heading: "제 마음",
            paragraphs: [
              "그 말들은 지금도 제 마음에 남아 있어요. 제 모습이 부족하다는 말도, 제가 아끼는 사람이 욕을 듣는 것도 많이 아팠어요.",
              "엄마 아빠가 어떤 마음에서 그 말씀을 하셨는지 저는 다 알지 못해요. 그래서 마음을 짐작해서 단정하지는 않으려고 해요.",
            ],
          },
          {
            heading: "바라는 것",
            paragraphs: [
              "그래도 그 말들에 대해서는 사과를 받고 싶어요. 이 마음을 작게 말하지 않으려고 해요.",
              "저도 엄마 아빠께 상처가 된 말이 있었다면 듣고 사과하고 싶어요.",
            ],
          },
        ],
        body: null,
        reviewNote:
          "실제 들은 말을 그대로 옮길지는 직접 정해 주세요. 날짜는 확인되지 않아 ‘그날’로 두었어요. 여자친구의 이름·개인정보는 넣지 않았어요.",
      },
      {
        id: "hard-to-say",
        title: "말을 꺼내기 어려웠던 이유",
        status: "needs_review",
        body: [
          "이야기를 꺼내면 다시 다툼이 되거나 비난받을까 봐 두려웠어요.",
          "얼굴을 마주하면 서로 감정이 앞서서, 하고 싶은 말을 끝까지 하지 못할 것 같았어요.",
          "그래서 엄마 아빠가 원하실 때 천천히 읽으실 수 있도록 이 공간에 적기로 했어요.",
        ],
      },
      {
        id: "hope",
        title: "그래도 바라는 것",
        status: "needs_review",
        body: [
          "저는 엄마 아빠와 다시 편하게 이야기하고 싶어요.",
          "모든 생각이 같아지지 않아도 괜찮아요. 서로에게 상처가 된 말은 사과하고, 앞으로는 서로를 깎아내리지 않는 가족이 되었으면 해요.",
          "지금 바로 무언가를 결정해 달라는 뜻은 아니에요. 제 이야기를 끝까지 들어주시면, 저도 엄마 아빠의 이야기를 끝까지 들을게요.",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "다시 믿을 수 있을까",
    summary: "아들이 신뢰를 다시 쌓기 위해 하고 있는 노력을 살펴볼 수 있어요.",
    requiresRecording: true,
    prelude: [
      {
        kind: "text",
        id: "r3-1",
        paragraphs: ["이 방은 아들이 부모님과의 신뢰를 다시 쌓고 싶어서 만든 공간이에요."],
        nextLabel: "다음",
      },
      {
        kind: "text",
        id: "r3-2",
        paragraphs: ["찾아와주신 엄마와 아빠에게 아들이 짧은 편지를 썼어요. 읽어보시겠어요?"],
        nextLabel: "편지 읽기",
      },
      { kind: "letter", id: "r3-letter", letterKey: "room3-pre", nextLabel: "다 읽었어요" },
      {
        kind: "text",
        id: "r3-3",
        paragraphs: ["읽어주셔서 감사해요."],
        nextLabel: "다음",
      },
      {
        kind: "choice",
        id: "r3-4",
        paragraphs: ["{parent} 제가 어떤 모습을 보여드리면 조금씩 안심하실 수 있을까요?"],
        options: [
          { label: "생각 적어두기", action: "write" },
          { label: "노력 살펴보기", action: "continue" },
        ],
      },
    ],
    entryPhrase: "네가 어떤 노력을 하고 있는지 살펴볼게.",
    // Each card: 지금 하고 있는 일 / 확인된 변화 / 다음 계획. No record = null = 준비 중.
    // Goals are never written as results.
    cards: [
      {
        id: "health",
        title: "건강을 돌보는 노력",
        status: "needs_review",
        body: null,
        sections: [
          {
            heading: EFFORT_HEADINGS[0],
            paragraphs: [
              "건강을 돌보기 위해 다이어트를 하고 있어요.",
              "누군가에게 잘 보이기 위해서가 아니라, 제 몸을 아끼고 오래 건강하게 지내기 위해서예요.",
            ],
          },
          { heading: EFFORT_HEADINGS[1], paragraphs: null },
          { heading: EFFORT_HEADINGS[2], paragraphs: null },
        ],
        reviewNote: "구체적인 방법(식단·운동 등)과 실제 기록이 생기면 ‘확인된 변화’에 적어 주세요. 목표 수치는 결과처럼 쓰지 마세요.",
      },
      {
        id: "finance",
        title: "재정 안정화",
        status: "needs_review",
        body: null,
        sections: [
          { heading: EFFORT_HEADINGS[0], paragraphs: null },
          { heading: EFFORT_HEADINGS[1], paragraphs: null },
          { heading: EFFORT_HEADINGS[2], paragraphs: null },
        ],
        reviewNote: "실제로 하고 있는 일(지출 관리, 저축 등)이 확인되지 않아 모두 비워 두었어요.",
      },
      {
        id: "repayment",
        title: "차용금 상환 준비",
        status: "needs_review",
        body: null,
        sections: [
          {
            heading: EFFORT_HEADINGS[0],
            paragraphs: ["부모님께 빌린 540,000,000원은 매달 1,575,000원씩 갚기로 약속되어 있어요."],
          },
          { heading: EFFORT_HEADINGS[1], paragraphs: null },
          { heading: EFFORT_HEADINGS[2], paragraphs: null },
        ],
        reviewNote: "실제 상환 내역은 확인되지 않아 ‘확인된 변화’를 비워 두었어요. 기록이 생기면 날짜와 금액을 그대로 적어 주세요.",
      },
    ],
  },
  {
    id: 4,
    title: "책임과 약속",
    summary: "아들이 책임져야 할 일과 앞으로 지킬 약속을 정리했어요.",
    requiresRecording: true,
    prelude: [
      {
        kind: "text",
        id: "r4-1",
        paragraphs: [
          "이 방에는 아들이 책임져야 할 일과 앞으로 지킬 약속을 정리했어요.",
          "걱정되시는 부분을 구체적으로 살펴보고 이야기할 수 있도록 준비했어요.",
        ],
        nextLabel: "다음",
      },
    ],
    entryPhrase: "네가 책임질 일을 어떻게 준비하는지 들어볼게.",
    // Stage 4 drafts. Only figures confirmed in 00_REQUIREMENTS.md. House price / gift / loan are
    // different money and are never added up as a "loss". Records, budget and timing = 준비 중.
    cards: [
      {
        id: "loan",
        title: "부모님께 빌린 돈",
        status: "needs_review",
        body: null,
        sections: [
          {
            heading: "확인된 사실",
            paragraphs: [
              "부모님께 540,000,000원을 빌렸고, 매달 1,575,000원씩 갚기로 약정했어요.",
              "증여해 주신 150,000,000원은 빌린 돈과 다른 돈이에요. 두 돈을 한데 묶어 말하지 않을게요.",
            ],
          },
          {
            heading: "제 책임",
            paragraphs: ["빌린 돈을 약정대로 갚는 것은 제 책임이에요. 이 약속은 지키겠습니다."],
          },
          { heading: "실제 상환 기록", paragraphs: null },
        ],
        reviewNote: "실제 상환 내역(날짜·금액)이 확인되지 않아 비워 두었어요. 기록이 생기면 있는 그대로 적어 주세요.",
      },
      {
        id: "wedding-cost",
        title: "새로운 결혼 비용",
        status: "needs_review",
        body: null,
        sections: [
          {
            heading: "제 생각",
            paragraphs: ["새로운 결혼을 준비하면서 부모님께 추가로 경제적인 지원을 요청하지 않으려고 해요."],
          },
          { heading: "예산과 준비 방법", paragraphs: null },
        ],
        reviewNote: "결혼 예산·일정은 확정되지 않아 비워 두었어요. 추가 지원을 요청하지 않겠다는 문장이 실제 생각과 맞는지 확인해 주세요.",
      },
      {
        id: "married-life",
        title: "결혼 이후의 생활",
        status: "needs_review",
        body: [
          "결혼 이후에 어디에서 어떻게 생활할지는 아직 정하지 않았어요.",
          "정해지기 전에 정해진 것처럼 말씀드리지 않을게요. 정해지면 있는 그대로 알려드릴게요.",
        ],
        reviewNote: "사는 곳·생활비 계획이 정해지면 채워 주세요.",
      },
      {
        id: "relatives",
        title: "친척들에게 설명하는 일",
        status: "needs_review",
        body: [
          "파혼과 다시 결혼을 준비하는 일을 친척들께 어떻게 설명할지가 엄마 아빠께 부담이 될 수 있다는 걸 알아요.",
          "제가 직접 설명드려야 할 부분이 있다면 제가 하겠어요.",
          "어떻게 하면 좋을지 엄마 아빠의 생각을 먼저 듣고 싶어요.",
        ],
      },
      {
        id: "if-hard",
        title: "계획이 어려워질 때",
        status: "needs_review",
        body: [
          "상환이나 생활 계획이 어려워지면 숨기지 않고 먼저 말씀드릴게요.",
          "그때도 바로 도움을 요청하기보다, 제가 할 수 있는 방법을 먼저 정리해서 말씀드릴게요.",
        ],
      },
      {
        id: "lines",
        title: "함께 지키고 싶은 선",
        status: "needs_review",
        body: [
          "돈을 빌렸다는 사실과 그에 따른 경제적인 책임은 분명히 제 몫이에요.",
          "다만 그 책임이 저나 제가 아끼는 사람을 깎아내리는 말을 들어도 된다는 뜻은 아니라고 생각해요.",
          "서로 화가 나더라도 외모를 깎아내리거나 사람을 향해 욕하지 않기로 함께 약속하고 싶어요.",
        ],
      },
    ],
    actions: {
      question: "어떤 부분이 가장 걱정되시나요?",
      titleOptions: ["걱정되는 점", "궁금한 점", "책임에 대해 바라는 것"],
      options: [
        { kind: "write", label: "걱정 남기기", heading: "걱정 남기기", title: "걱정되는 점" },
        { kind: "dismiss", label: "지금은 읽기만 할게요", message: "괜찮아요. 읽어주신 것만으로도 고마워요." },
      ],
    },
  },
  {
    id: 5,
    title: "앞으로의 삶",
    summary: "아들이 앞으로 살고 싶은 삶과 준비하고 있는 생각을 적었어요.",
    requiresRecording: true,
    prelude: [
      {
        kind: "text",
        id: "r5-1",
        paragraphs: [
          "이 방에는 아들이 앞으로 어떤 삶을 살고 싶은지 적었어요.",
          "지금 결혼에 찬성해 달라는 뜻은 아니에요.",
          "어떤 생각으로 준비하고 있는지 먼저 들어주셨으면 해요.",
        ],
        nextLabel: "다음",
      },
    ],
    entryPhrase: "네가 생각하는 앞으로의 삶을 들어볼게.",
    // No personal information or words of the girlfriend. No dates or money plans (not confirmed).
    cards: [
      {
        id: "why",
        title: "다시 결혼을 생각하게 된 이유",
        status: "needs_review",
        body: ["파혼을 겪은 뒤에도, 다시 누군가와 가정을 꾸리고 싶다는 마음이 생겼어요."],
        reviewNote: "다시 결혼을 생각하게 된 이유를 직접 적어 주세요. 여자친구의 개인정보나 그분의 말은 본인 동의 없이 넣지 마세요.",
      },
      {
        id: "reality",
        title: "서로 알고 있는 현실",
        status: "needs_review",
        body: [
          "제가 파혼을 겪었다는 것, 부모님께 빌린 돈과 매달 갚아야 할 금액이 있다는 것을 숨기지 않고 함께 알고 시작하려고 해요.",
        ],
        reviewNote: "여자친구가 실제로 알고 있는 내용과 맞는지 확인해 주세요.",
      },
      {
        id: "life",
        title: "함께 준비할 생활",
        status: "needs_review",
        body: null,
        reviewNote: "함께 준비하고 있는 생활(일, 집안일, 생활비 등)이 확인되면 적어 주세요.",
      },
      {
        id: "undecided",
        title: "아직 결정하지 않은 것",
        status: "needs_review",
        body: [
          "결혼 날짜, 결혼식 규모와 예산, 사는 곳은 아직 정하지 않았어요.",
          "정해지기 전에 정해진 것처럼 말씀드리지 않을게요.",
        ],
      },
      {
        id: "participation",
        title: "부모님께 바라는 참여",
        status: "needs_review",
        body: [
          "지금 결혼에 찬성해 달라는 뜻은 아니에요.",
          "마음이 준비되신다면, 상견례 자리에 함께해 주셨으면 해요. 결혼식에도 함께해 주시기를 바라요.",
          "이건 제 부탁이에요. 언제, 어떻게 하실지는 엄마 아빠가 정하셔도 괜찮아요.",
        ],
      },
    ],
    actions: {
      question: "읽으시면서 드는 마음을 남겨주실 수 있어요.",
      titleOptions: ["걱정되는 점", "응원하는 마음", "궁금한 점"],
      options: [
        { kind: "write", label: "걱정 남기기", heading: "걱정 남기기", title: "걱정되는 점" },
        { kind: "write", label: "응원 남기기", heading: "응원 남기기", title: "응원하는 마음" },
        { kind: "dismiss", label: "나중에 생각하기", message: "괜찮아요. 천천히 생각하셔도 돼요." },
      ],
    },
  },
  {
    id: 6,
    title: "다시 가족으로",
    summary: "앞으로 서로를 어떻게 대하면 좋을지 생각해 보는 곳이에요.",
    requiresRecording: true,
    prelude: [
      {
        kind: "text",
        id: "r6-1",
        paragraphs: [
          "서로 다르게 기억하는 일도 있고, 아직 아픈 말도 남아 있을 수 있어요.",
          "이 방에서는 앞으로 서로를 어떻게 대하면 좋을지 생각해 보려고 해요.",
        ],
        nextLabel: "다음",
      },
    ],
    entryPhrase: "서로 상처받은 부분을 돌아보고 싶어.",
    // 구체적인 일 / 영향 / 바라는 변화. Mutual apology is hoped for, never demanded
    // (the entry recording is only about looking back, not an apology).
    cards: [
      {
        id: "my-sorry",
        title: "제가 미안한 일",
        status: "needs_review",
        body: null,
        sections: [
          { heading: "구체적인 일", paragraphs: null },
          { heading: "그 일이 준 영향", paragraphs: null },
          { heading: "앞으로 바꿀 것", paragraphs: null },
        ],
        reviewNote: "제가 실제로 미안한 말이나 행동을 직접 적어 주세요. 지어내지 않으려고 모두 비워 두었어요.",
      },
      {
        id: "want-apology",
        title: "제가 사과받고 싶은 일",
        status: "needs_review",
        body: null,
        sections: [
          {
            heading: "구체적인 일",
            paragraphs: ["제 외모를 깎아내리는 말과, 제 여자친구를 향한 욕설을 들었어요."],
          },
          {
            heading: "그 일이 준 영향",
            paragraphs: ["그 말들은 지금도 마음에 남아 있고, 그 뒤로 엄마 아빠께 이야기를 꺼내기가 더 어려워졌어요."],
          },
          {
            heading: "바라는 변화",
            paragraphs: [
              "그 말들에 대해 사과를 받고 싶어요.",
              "그리고 앞으로는 서로의 외모를 깎아내리거나 사람을 향해 욕하지 않았으면 해요.",
            ],
          },
        ],
        reviewNote: "‘그 일이 준 영향’은 초안이에요. 실제 마음과 다르면 고쳐 주세요.",
      },
      {
        id: "keep-together",
        title: "앞으로 함께 지키고 싶은 것",
        status: "needs_review",
        body: [
          "화가 나도 외모를 깎아내리는 말이나 욕설은 하지 않기.",
          "한 번에 한 가지 이야기만 하기.",
          "말이 격해지면 잠시 멈추고, 다음에 이어서 이야기하기.",
          "서로의 말을 끝까지 듣기.",
        ],
      },
      {
        id: "your-heart",
        title: "부모님의 마음도 듣고 싶어요",
        status: "needs_review",
        body: [
          "엄마 아빠도 저 때문에 서운하셨던 일이 있을 거예요. 그 이야기도 듣고 싶어요.",
          "제가 사과드려야 할 일이라면 사과드리고 싶어요.",
          "지금 바로 말씀하지 않으셔도 괜찮아요. 마음이 준비되실 때 들려주세요.",
        ],
      },
    ],
    actions: {
      question: "남기고 싶은 마음이 있으시면 적어주세요. 꼭 적지 않으셔도 괜찮아요.",
      titleOptions: ["서운했던 일", "미안한 마음", "앞으로 바라는 점"],
      options: [
        { kind: "write", label: "서운했던 일 적기", heading: "서운했던 일 적기", title: "서운했던 일" },
        { kind: "write", label: "미안한 마음 전하기", heading: "미안한 마음 전하기", title: "미안한 마음" },
        { kind: "write", label: "앞으로 바라는 점 적기", heading: "앞으로 바라는 점 적기", title: "앞으로 바라는 점" },
        { kind: "dismiss", label: "더 생각하기", message: "괜찮아요. 더 생각해 보시고, 언제든 다시 오셔도 돼요." },
      ],
    },
  },
  {
    id: 7,
    title: "이제 이야기해 볼까",
    summary: "서로 이야기할 방법을 골라볼 수 있어요.",
    requiresRecording: true,
    prelude: [
      {
        kind: "text",
        id: "r7-1",
        paragraphs: [
          "여기까지 와주셔서 감사해요.",
          "모든 생각이 같아지지 않았어도 괜찮아요.",
          "서로의 말을 차분히 들어볼 준비가 된다면 대화할 방법을 골라주세요.",
        ],
        nextLabel: "다음",
      },
    ],
    entryPhrase: "서로의 말을 차분히 들어보며 이야기하고 싶어.",
    // Room 7 body: conversation principles (from 04) + ways to start talking. No cards.
    cards: [],
    conversation: {
      intro: ["이야기할 방법을 골라주세요. 아들이 수락하기 전까지는 ‘제안 중’으로 남아요. 약속이 저절로 정해지거나 문자가 가지 않아요."],
      titleOptions: ["지금 전하고 싶은 이야기", "함께 이야기하고 싶은 것"],
      principles: [
        "끝까지 듣기",
        "욕설과 비하는 하지 않기",
        "한 번에 한 가지 이야기만 하기",
        "말이 격해지면 잠시 멈추기",
        "한 번에 모든 것을 해결하려고 하지 않기",
      ],
      methods: [
        { method: "write", label: "글로 대화하기", description: "아들에게 글을 써서 전해요." },
        { method: "call", label: "전화 제안하기", description: "통화하고 싶은 때를 제안해요." },
        { method: "meet", label: "만남 제안하기", description: "만나고 싶은 때와 장소를 제안해요." },
        { method: "with_someone", label: "다른 사람과 함께", description: "믿을 수 있는 분과 함께 이야기하자고 제안해요." },
        { method: "more_time", label: "시간이 더 필요해요", description: "지금은 이야기하지 않아도 괜찮아요." },
      ],
    },
  },
];

/** Pre-gate letters (room 3). Allowed before the gate (preparation). Drafts are hidden from parents. */
const LETTERS: Record<string, LetterDef> = {
  "room3-pre": {
    title: "찾아와주신 엄마와 아빠에게",
    status: "needs_review",
    paragraphs: [
      "엄마, 아빠. 여기까지 찾아와 주셔서 고마워요.",
      "다시 믿어 달라고 말로만 부탁하지는 않을게요. 믿음은 말보다 시간이 걸려야 다시 쌓인다는 걸 알아요.",
      "그래서 이 방에는 제가 지금 하고 있는 노력과 앞으로의 계획을 있는 그대로 적어 두려고 해요. 아직 결과가 없는 것은 없다고 솔직하게 쓸게요.",
      "급하게 마음을 정하지 않으셔도 괜찮아요. 천천히 지켜봐 주세요.",
      "아들 올림",
    ],
    reviewNote: "감사 편지 초안이에요. 직접 읽어 보시고 말투를 고쳐 주세요.",
  },
};

// ---------------------------------------------------------------------------------------
// Publishing. Parents only ever see PUBLISHED text: either the son published it from the
// admin screen (content_versions), or -- if he never edited it there -- the default text in
// this file is marked status "approved". Everything else is "준비 중" for parents.
// ---------------------------------------------------------------------------------------

export const cardKey = (roomId: number, cardId: string) => `card.${roomId}.${cardId}`;
export const letterKey = (k: string) => `letter.${k}`;
export const INTRO_LETTER_KEY = "letter.intro";

/** Keeps the fixed section headings from the code; only paragraphs come from the edit. */
function mergeSections(code: CardSection[] | undefined, edited: CardSection[] | null): CardSection[] | null {
  if (!code?.length) return null;
  return code.map((s) => ({ heading: s.heading, paragraphs: edited?.find((e) => e.heading === s.heading)?.paragraphs ?? null }));
}

function effective(key: string, status: ReviewStatus, code: ContentJson): ContentJson | null {
  const row = getContentRow(key);
  if (row) return row.published;
  return status === "approved" ? code : null;
}

const codeCard = (c: CardDef): ContentJson => ({ body: c.body, sections: c.sections ?? null });

function publishedCard(roomId: number, c: CardDef) {
  const e = effective(cardKey(roomId, c.id), c.status, codeCard(c));
  return { id: c.id, title: c.title, body: e?.body ?? null, sections: e ? mergeSections(c.sections, e.sections) : null };
}

function publishedLetter(key: string, l: LetterDef) {
  const e = effective(letterKey(key), l.status, { body: l.paragraphs, sections: null });
  return { title: l.title, paragraphs: e?.body ?? null };
}

/** First-visit short letter for parents (published text only). */
export function publishedIntroLetter() {
  const e = effective(INTRO_LETTER_KEY, INTRO_LETTER.status, { body: INTRO_LETTER.paragraphs, sections: null });
  return { title: INTRO_LETTER.title, paragraphs: e?.body ?? null };
}

const PARENT_SUBJECT: Record<ParentRole, string> = { mother: "어머니는", father: "아버지는" };

function resolve(text: string, role: ParentRole): string {
  return text.replaceAll("{parent}", PARENT_SUBJECT[role]);
}

function resolveStep(step: PreludeStep, role: ParentRole): PreludeStep {
  if (step.kind === "letter") return step;
  return { ...step, paragraphs: step.paragraphs.map((p) => resolve(p, role)) };
}

export const ROOM_IDS = ROOMS.map((r) => r.id);

export function parseRoomId(raw: string): number | null {
  if (!/^[1-7]$/.test(raw)) return null;
  const id = Number(raw);
  return ROOMS.some((r) => r.id === id) ? id : null;
}

export function listRooms(): RoomListItem[] {
  return ROOMS.map(({ id, title, summary, requiresRecording }) => ({ id, title, summary, requiresRecording }));
}

/** Pre-gate view for the client. Deliberately contains NO cards (room body). */
export function getRoomPreludeView(id: number, role: ParentRole): RoomPreludeView | null {
  const room = ROOMS.find((r) => r.id === id);
  if (!room) return null;
  const letterKeys = room.prelude.flatMap((s) => (s.kind === "letter" ? [s.letterKey] : []));
  return {
    id: room.id,
    title: room.title,
    requiresRecording: room.requiresRecording,
    prelude: room.prelude.map((s) => resolveStep(s, role)),
    entryPhrase: room.entryPhrase,
    letters: Object.fromEntries(
      letterKeys.map((k) => [k, LETTERS[k] ? publishedLetter(k, LETTERS[k]) : { title: "", paragraphs: null }]),
    ),
  };
}

/**
 * Room body. Call ONLY after the gate succeeded for this session and room
 * (enter API), or for room 1 which has no gate.
 */
export function getRoomBodyAfterGate(id: number): RoomBodyView | null {
  const room = ROOMS.find((r) => r.id === id);
  if (!room) return null;
  // Questions/choices and the room 7 principles are fixed by docs/04 (not drafts), so they are always included.
  return {
    id: room.id,
    title: room.title,
    cards: room.cards.map((c) => publishedCard(room.id, c)),
    actions: room.actions ?? null,
    conversation: room.conversation ?? null,
  };
}

/** Server-only access to the full definition (stage 2 gate + content API use this). */
export function getRoomDefinition(id: number): RoomDef | null {
  return ROOMS.find((r) => r.id === id) ?? null;
}

export const ROOM1_INTRO = [
  "아직 많이 화가 나실 수 있어요.",
  "서운하고 답답하고, 지금은 아들의 이야기를 듣고 싶지 않으실 수도 있어요.",
  "여기서는 마음을 바로 정리하지 않으셔도 괜찮아요.",
  "우선 어떤 마음인지 적어두셔도 돼요.",
];

// ---------------------------------------------------------------------------------------
// Admin (son) only: everything that can be edited and published. Never call from parent code.
// ---------------------------------------------------------------------------------------

export type EditableItem = {
  key: string;
  group: string;
  title: string;
  reviewNote?: string;
  /** Fixed section headings (cards with sections); null = one free text area. */
  headings: string[] | null;
  /** The son's current working text (DB draft, or the default text in code). */
  draft: ContentJson;
  /** What parents see right now; null = 준비 중. */
  published: ContentJson | null;
  source: "admin" | "code";
  updatedAt: number | null;
  publishedAt: number | null;
};

function editable(key: string, group: string, title: string, status: ReviewStatus, code: ContentJson, headings: string[] | null, reviewNote?: string): EditableItem {
  const row = getContentRow(key);
  const merge = (c: ContentJson): ContentJson => ({ body: c.body, sections: headings ? mergeSections(code.sections ?? undefined, c.sections) : null });
  return {
    key,
    group,
    title,
    reviewNote,
    headings,
    draft: row ? merge(row.draft) : code,
    published: row ? (row.published ? merge(row.published) : null) : status === "approved" ? code : null,
    source: row ? "admin" : "code",
    updatedAt: row?.updatedAt ?? null,
    publishedAt: row?.publishedAt ?? null,
  };
}

export function listEditableContent(): EditableItem[] {
  const items: EditableItem[] = [
    editable(INTRO_LETTER_KEY, "처음 안내", INTRO_LETTER.title, INTRO_LETTER.status, { body: INTRO_LETTER.paragraphs, sections: null }, null),
    ...Object.entries(LETTERS).map(([k, l]) =>
      editable(letterKey(k), "3번 방 편지", l.title, l.status, { body: l.paragraphs, sections: null }, null, l.reviewNote),
    ),
  ];
  for (const r of ROOMS) {
    for (const c of r.cards) {
      const headings = c.sections?.map((s) => s.heading) ?? null;
      items.push(editable(cardKey(r.id, c.id), `${r.id}번 방 · ${r.title}`, c.title, c.status, codeCard(c), headings, c.reviewNote));
    }
  }
  return items;
}

export function getEditableContent(key: string): EditableItem | null {
  return listEditableContent().find((i) => i.key === key) ?? null;
}
