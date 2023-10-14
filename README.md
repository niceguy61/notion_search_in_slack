![N|Solid](https://capsule-render.vercel.app/api?type=waving&color=auto&height=200&section=header&text=To%20The%20DevOps&fontSize=90)
# Notion Search In Slack

## Run Command
```
npm i
npm start
```

# .env 추가값
- NOTION_API_KEY (Notion API Key)
- NOTION_DATABASE_ID (검색대상 Database ID)

## Notion 설정

- 노션 관리자 여야 함.
- https://developers.notion.com 에서 Workspace용 API 발급
- secrets에 나오는 키는 API KEY
- Capabilities에서의 권한은 Read Content
- User Capabilities는 No User Information

## Slack 설정

- https://api.slack.com/apps 이동
- Create New App 선택
- App Name, Workspace 선택 후 생성
- Oauth & Permission 선택 후 아래의 권한 추가 필요

## Slackbot Oauth & Permission
- chat:write: 이 권한은 봇이 메시지를 Slack 채널 또는 DM에 게시하는 데 필요합니다.
- commands: Slash Command를 사용하기 위한 권한으로, 이 권한을 허용해야 봇이 사용자의 명령을 인식하고 처리할 수 있습니다.
- app_mentions:read: 봇이 Slack 채널에서 언급되었을 때 이를 감지하고 대화에 응답하는 데 필요한 권한입니다.
- im:read: 봇이 DM(다이렉트 메시지)를 읽고 사용자와 상호 작용할 수 있도록 해주는 권한입니다.
- im:write: 봇이 DM에 메시지를 보내거나 답장하는 데 필요한 권한입니다.
- incoming-webhook: 이 권한은 웹훅을 통해 Slack에 메시지를 게시하거나 다른 액션을 수행하는 데 사용됩니다.
- users:read: Slack 워크스페이스의 사용자 목록을 읽는 권한으로, 봇이 사용자를 인식하고 다양한 작업을 수행할 수 있도록 해줍니다.
- users:read.email: 사용자의 이메일 주소를 읽는 권한으로, 봇이 사용자와 관련된 정보를 더 쉽게 관리할 수 있도록 해줍니다.
- users.profile:read: 사용자 프로핸일 정보를 읽는 권한으로, 봇이 사용자의 프로필 정보를 확인하고 인식할 수 있도록 해줍니다.
- channels:read: Slack 채널 목록을 읽는 권한으로, 봇이 채널 정보를 확인하고 사용자와 상호 작용할 수 있도록 해줍니다.
- channels:history: Slack 채널의 메시지 히스토리를 읽는 권한으로, 봇이 이전 메시지에 접근하고 이해하는 데 필요합니다.
- views:publish: 대화형 메시지를 사용하는 경우, 이 권한은 봇이 대화형 메시지를 보내고 사용자와 상호 작용할 수 있도록 해줍니다.
