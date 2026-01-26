from pyhwpx import Hwp

hwp = Hwp()  # 보안모듈 자동 등록

# 텍스트 삽입
hwp.insert_text("Hello world!")

# win32com 방식으로도 실행 가능
pset = hwp.HParameterSet.HInsertText
pset.Text = "Hello world!"
hwp.HAction.Execute("InsertText", pset.HSet)

# 문서 저장
hwp.save_as("./helloworld2.hwp")

# 한/글 종료
hwp.quit()
