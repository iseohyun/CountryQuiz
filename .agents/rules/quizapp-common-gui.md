# QuizApp Common GUI 동기화 기록

> 원본: https://iseohyun.com/#/column/ai/quizapp-common-gui/rules/changes.md
> WebApp Common GUI 기록(`common-gui.md`)과 따로 둔다.

- 확인한 판: v0.2.0 (2026-11-20)
- 앱의 표시: `index.html`의 `window.QUIZAPP_GUI_VERSION = "v0.2.0"`(도움말 맨 아래에 보임)
- CountryQuiz 는 CharQuiz 를 `3e7c941`(2026-11-19 15:50) 무렵에 복사해 만들었다. v0.2.0 항목은 그 뒤 CharQuiz 커밋(`3a36556`~`e00ef5b`)을 옮겨 받았다.

| 항목 ID | 판 | 결정 | 날짜 | 메모 |
| :--- | :--- | :--- | :--- | :--- |
| quiz-base | v0.1.0 | 적용 | 2026-11-19 | CharQuiz 복사로 시작 |
| firebase-shared | v0.1.0 | 적용 | 2026-11-19 | quizquiz-quiz, countryquiz_* 순위 |
| legacy-users | v0.1.0 | 해당 없음 | 2026-11-20 | 새 앱이라 이어 받을 옛 프로젝트 기록이 없음 |
| season-stage | v0.2.0 | 적용 | 2026-11-19 | 복사할 때 함께 들어옴 |
| guest-ranking | v0.2.0 | 적용 | 2026-11-20 | QuizQuiz `firestore.rules`의 countryquiz_* 도 본인 uid만(배포는 따로) |
| accent-color | v0.2.0 | 적용 | 2026-11-20 | 기기 값 `COUNTRYQUIZ_ACCENT` |
| combo-record | v0.2.0 | 적용 | 2026-11-20 | 필드 `countryquizCombo`, `countryquizMaxCombo` |
| review-always | v0.2.0 | 적용 | 2026-11-20 | |
| notify-throttle | v0.2.0 | 적용 | 2026-11-20 | QuizQuiz 발송 함수에서 이미 적용(앱은 할 일 없음) |
| combo | v0.2.0 | 적용 | 2026-11-20 | |
| install-sister | v0.2.0 | 적용 | 2026-11-20 | 자매품 링크는 CharQuiz 처럼 도움말 맨 위(quiz_apps DB) |
| help-version | v0.2.0 | 적용 | 2026-11-20 | |
| system-bar-white | v0.2.0 | 적용 | 2026-11-20 | |
