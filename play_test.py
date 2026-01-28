# import requests

# url = "https://pkimp.duckdns.org/webhook-test/df1e6dcf-3331-44e0-a47f-2320d34c6c03"

# # 전송할 데이터
# data = {
#     "name": "홍길동",
#     "company": "한컴테크놀로지",
#     "email": "hong@hancom.com",
#     "phone": "010-1234-5678",
#     "projectType": "웹 애플리케이션",
#     "description": "신규 프로젝트 문의입니다. 견적 요청드립니다."
# }

# # POST 요청 보내기
# response = requests.post(url, json=data)

# # 응답 확인
# print(f"Status Code: {response.status_code}")
# print(f"Response: {response.text}")


# Telegram Bot API - getUpdates
import requests

url = "https://api.telegram.org/bot8187796371:AAF802_ZRkveDBj4NFO_LREe_sDyb_-J-Tw/getUpdates"

# GET 요청 보내기
response = requests.get(url)

# 응답 확인
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
