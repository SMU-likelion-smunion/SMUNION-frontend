// inviteBtn을 제외하고 다른 img 요소에 클릭 이벤트 적용
document.querySelectorAll('img').forEach(function (element) {
  if (!element.classList.contains('inviteBtn')) {
    element.onclick = function () {
      if (this.classList.contains('circle')) {
        this.classList.remove('circle');
        this.classList.add('checked_circle');
        this.src = "../../assets/icons/checked_circle.png";
      } else if (this.classList.contains('checked_circle')) {
        this.classList.remove('checked_circle');
        this.classList.add('circle');
        this.src = "../../assets/icons/circle.png";
      }
    };
  }
});

// inviteBtn 동작은 show() 함수에서만 처리
function show() {
  var table = document.getElementById('table');
  var inviteBtn = document.getElementById('inviteBtn');
  if (table && inviteBtn) {
    const currentSrc = inviteBtn.src.split('/').pop(); // 이미지 파일명 추출

    if (table.style.display === 'none' && currentSrc === 'circle.png') {
      // 테이블 표시 및 버튼 상태 변경
      table.style.display = 'table';
      inviteBtn.src = "../../assets/icons/checked_circle.png";
      inviteBtn.classList.remove('circle');
      inviteBtn.classList.add('checked_circle');
    } else {
      // 테이블 숨기기 및 버튼 상태 복원
      table.style.display = 'none';
      inviteBtn.src = "../../assets/icons/circle.png";
      inviteBtn.classList.remove('checked_circle');
      inviteBtn.classList.add('circle');
    }
  }
}
