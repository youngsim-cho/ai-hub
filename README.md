# IAE AI Hub

AI 도입 준비, 아이디어, AI 과제 진행 상황을 한곳에서 관리하는 웹앱입니다.
별도 서버 없이 GitHub Pages에서 사용할 수 있습니다.

## 내 컴퓨터에서 보기

이 폴더 맨 위의 **index.html을 더블클릭**해서 Edge 또는 Chrome으로 여세요. 추가 설치는 필요 없습니다.

## 사용하는 방법

- **대시보드**: 전체 준비도와 과제 현황을 봅니다.
- **도입 준비**: 준비 항목의 상태를 바꿉니다.
- **아이디어 등록**: 아이디어를 적고 저장합니다. 이후 **과제로 전환**할 수 있습니다.
- **AI 과제·앱**: 과제의 진행 단계를 바꿉니다.
- **테스트·배포**: 운영 전에 확인할 항목을 봅니다.
- **지침·자료**: 준비 중인 자료 목록입니다. 원본에 실제 문서는 들어 있지 않습니다.

처음 보이는 자료는 예시이며, ‘이대리’도 실제 이름이 아닙니다.

## 저장에 관해 알아두세요

입력한 내용은 **현재 브라우저에만 저장**됩니다(localStorage). 서버로 보내지 않습니다.
다른 사람, 다른 기기, 다른 브라우저와 자동으로 공유되지 않습니다.
브라우저 데이터를 지우면 기록도 없어집니다. 시크릿 창에서는 창을 닫을 때 사라질 수 있습니다.
컴퓨터에서 연 화면과 GitHub Pages 화면은 저장 공간이 서로 다릅니다.
파일을 다른 폴더로 옮겨 열면 기존 기록이 보이지 않을 수 있습니다.
저장 실패 안내가 나오면 저장된 것으로 생각하지 말고 브라우저의 저장 권한과 여유 공간을 확인하세요.

## GitHub Pages에 올리기

1. GitHub 저장소에 이 폴더의 파일을 올립니다. `index.html`이 저장소 맨 위에 있어야 합니다.
2. `assets` 폴더, `public` 폴더와 빈 `.nojekyll` 파일도 꼭 포함합니다.
3. 저장소의 **Settings → Pages**를 엽니다.
4. **Source → Deploy from a branch**, **Branch → main**, 폴더는 **/(root)**를 선택하고 **Save**를 누릅니다. 기본 브랜치 이름이 다르면 그 이름을 선택하세요.
5. 게시가 끝나면 Pages 화면에 표시되는 주소로 접속합니다.

이미 실행용 파일을 만들어 두었으므로 GitHub에서 별도로 빌드할 필요가 없습니다.
파일을 손으로 업로드할 때는 `node_modules`나 `.env` 같은 개인 설정 파일을 올리지 마세요. `.gitignore`는 Git으로 올릴 때 적용됩니다.

[GitHub 공식 게시 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 폴더 안내

- `index.html`: 웹앱의 시작 파일
- `assets`: 바로 실행할 수 있도록 만든 화면 스타일과 JavaScript
- `public`: 아이콘과 이미지
- `app`, `components`, `hooks`, `lib`, `vendor`: 화면을 수정할 때 사용하는 원본 코드
- `scripts`, `tests`, `package.json`, `pnpm-lock.yaml`: 개발·점검용 파일
- `.nojekyll`: GitHub Pages에서 파일을 그대로 게시하게 하는 빈 파일
- `.gitignore`: GitHub에 올리지 않을 파일의 목록

## 코드를 수정하는 사람을 위한 안내

일반 사용자는 아래 작업을 하지 않아도 됩니다. Node.js 22.13 이상과 pnpm이 있는 환경에서:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm preview
```

미리보기 주소는 `http://127.0.0.1:4173/IAE-AI-Hub/`입니다. 종료하려면 터미널에서 Ctrl+C를 누릅니다.
코드를 수정했다면 `pnpm build` 후 갱신된 `assets`도 함께 올려야 화면에 반영됩니다.
앱에서 입력한 기록은 소스 파일에 저장되지 않으므로 GitHub 업로드에 자동으로 포함되지 않습니다.
