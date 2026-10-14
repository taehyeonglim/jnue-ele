# 전주교대 초등교육과 — 매력 초과

LAMP 전공홍보용 한 페이지 랜딩. https://taehyeonglim.github.io/jnue-elementary/

- 정적 HTML/CSS/JS, 빌드 없음. 수정 후 `git push` 하면 1~2분 뒤 반영.
- 발표 모드: 가로 1024px 이상에서 자동. `P` 키로 전환. →/Space/PageDown 다음 섹션, ←/PageUp 이전, 숫자키 1~9 해당 섹션.
- 영상: `media/` 에 720p mp4 직접 호스팅(trailer·v23·v24, 각 100MB 미만 유지). `index.html` 상단 `window.SITE.videos` 가 파일 경로면 직접 재생, 11자 ID면 유튜브. 원본·재인코딩 명령은 드라이브 건 폴더 `트레일러/README.md`.
- 스크린샷 점검: `python3 -m http.server 8791 --bind 127.0.0.1` 띄우고 `python3 tools/shots.py <출력폴더>`.

그림 ⓒ 제38대 초등교육과 학생회 · 영상 ⓒ 초등교육과 23·24학번
