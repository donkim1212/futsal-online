# 팀 프로젝트) 풋살 온라인 (17조)

## 개요
FC온라인을 모티브로 한 풋살 게임의 Node.js (express) 서버를 구현했습니다.
<br>
<br>

**과제 요구 사항** [링크](https://teamsparta.notion.site/Node-js-cd42858726694646b3cf1a656a573714)
<br>
<br>
<br>

## 2. API 명세서
### API 목록 [링크](https://www.notion.so/teamsparta/e422163c6cc74be88aa779e8e88e92c2?v=df653fdd03fd4d4a994f17773ce388c0&pvs=4)
<br>
<br>
<br>

## 3. ER Diagram
![futsal-online-erd-final-final drawio](https://github.com/donkim1212/futsal-online/assets/32076275/194623ec-d923-4714-9135-b51af559bfe6)
<br>
<br>
<br>

## 4. 게임 로직 소개
상대 유저의 ID를 골라서 직접 싸우는 versus 모드와 자동으로 rating이 비슷한 상대를 골라주는 matchmaking 방식 중 하나를 선택하여 플레이 할 수 있습니다. 다음은 매치 메이킹으로 플레이 했을 때의 게임 흐름 예시입니다.

1. 팀 멤버를 3명 까지 채우면 MatchQueue에 user_id가 저장되어 자동으로 매칭 가능한 상태가 됩니다.
2. 매치 메이킹 API를 호출하면 매칭 가능한 유저들 중 자신과 가장 가까운 rating을 가진 유저를 최대 9명 까지 뽑아서 그 중에서 랜덤으로 상대를 선택합니다.
3. 상대가 확정되면 우선 양 팀의 전투력을 측정합니다.
4. 이번 게임에서 발생할 최대 골 횟수를 다음의 식을 통해 계산합니다.
 - Math.round((Math.random() * Math.abs(myTeamPower - opTeamPower)) / 10 + Math.floor(Math.random() * 3));
 - myTeamPower와 opTeamPower가 각각 자신과 상대 팀의 전투력입니다. 전투력은 정해진 MODIFIER를 이용해 정규화한 팀 내 선수 스탯의 합 입니다.
5. 앞서 계산한 최대 골 횟수 만큼 루프를 돌며, 과제 요구 사항의 승리 로직을 골 여부를 판단하는 로직으로 사용한 뒤 스코어를 기록합니다.
6. 기록된 스코어에 맞춰 승패를 결정하고, 승점, 매치 기록, 승/무/패 기록을 생성/갱신합니다.
<br>
<br>
<br>
