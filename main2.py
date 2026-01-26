import win32com.client as win32
import os

hwp = win32.gencache.EnsureDispatch("HWPFrame.HwpObject")

# 한글 창 표시 (환경에 따라 Visible 속성이 안 먹을 수도 있음)
try:
    hwp.XHwpWindows.Item(0).Visible = True
except Exception:
    pass

# 새 문서
hwp.HAction.Run("FileNew")

# 텍스트 입력 (단순 입력)
hwp.HAction.GetDefault("InsertText", hwp.HParameterSet.HInsertText.HSet)
hwp.HParameterSet.HInsertText.Text = "안녕하세요. 파이썬에서 한글 자동화 테스트입니다."
hwp.HAction.Execute("InsertText", hwp.HParameterSet.HInsertText.HSet)

# 저장
out_path = os.path.abspath("test.hwp")
hwp.HAction.GetDefault("FileSaveAs", hwp.HParameterSet.HFileSaveAs.HSet)
hwp.HParameterSet.HFileSaveAs.filename = out_path
hwp.HParameterSet.HFileSaveAs.Format = "HWP"  # 버전에 따라 다를 수 있어 실패 시 확인 필요
hwp.HAction.Execute("FileSaveAs", hwp.HParameterSet.HFileSaveAs.HSet)

# 종료
# hwp.HAction.Run("FileQuit")
