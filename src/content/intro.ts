import "server-only";
import type { ReviewStatus } from "./types";

/**
 * First-visit content.
 * - INTRO text is fixed by the requirements (00_REQUIREMENTS.md) -> approved.
 * - LETTER is a DRAFT written for review. The son must read and edit it
 *   before showing it to his parents. Keep facts out of it unless confirmed.
 */

export const INTRO = {
  status: "approved" as ReviewStatus,
  title: "이 공간을 만든 이유",
  paragraphs: [
    "엄마, 아빠.",
    "직접 이야기하면 서로 마음이 더 다칠까 봐, 제 마음을 천천히 전할 수 있는 공간을 만들었어요.",
    "지금 바로 읽지 않으셔도 괜찮아요. 읽고 싶은 날, 읽고 싶은 만큼만 봐주세요.",
    "바로 답하거나 어떤 결정을 내리지 않으셔도 괜찮아요.",
  ],
};

export const INTRO_LETTER = {
  status: "needs_review" as ReviewStatus,
  title: "짧은 편지",
  paragraphs: [
    "엄마, 아빠께.",
    "요즘 마음이 많이 무거우셨을 것 같아요. 저도 하고 싶은 말이 많았는데, 얼굴을 마주하면 말이 엇나갈까 봐 쉽게 꺼내지 못했어요.",
    "그래서 이곳에 제 마음을 조금씩 적어 두었어요. 고마웠던 마음, 죄송한 마음, 저도 아팠던 마음, 그리고 앞으로 어떻게 지내고 싶은지를요.",
    "순서대로 보지 않으셔도 되고, 다 읽지 않으셔도 괜찮아요. 마음이 내키실 때 한 칸씩만 열어봐 주세요.",
    "아들 올림",
  ],
};

export const GUIDE = {
  status: "approved" as ReviewStatus,
  title: "이렇게 사용하시면 돼요",
  items: [
    "방은 모두 일곱 개예요. 순서대로 보지 않으셔도 되고, 보고 싶은 방만 고르시면 돼요.",
    "1번 방은 바로 열려요. 지금 드는 마음을 적어두실 수 있어요.",
    "2번부터 7번 방은 들어가기 전에 화면에 보이는 한 문장을 직접 말씀해 녹음하고, 그 녹음을 끝까지 들으신 뒤에 들어가요. 방에 들어갈 때마다 매번 새로 녹음해요.",
    "녹음은 아들에게 전달되지 않고 저장되지도 않아요. 방에 들어가는 확인에만 쓰고 바로 지워요.",
    "화면은 저절로 넘어가지 않아요. 아래쪽의 큰 버튼을 누르셔야 다음으로 넘어가요.",
    "글씨가 작으면 화면 맨 아래의 ‘글씨 크기’ 버튼을 눌러 크게 볼 수 있어요.",
    "언제든 화면 위쪽의 ‘방 목록’ 버튼으로 돌아갈 수 있고, 이 안내는 방 목록에서 다시 볼 수 있어요.",
    "다 보신 뒤에는 화면 맨 아래의 ‘나가기’ 버튼을 눌러주세요. 다음에 오실 때는 비밀번호를 다시 입력해요.",
  ],
};
