//부서 열고 닫을수 있게
function deptMemSee(imgElement) {
  var memberInfo = imgElement.parentElement.nextElementSibling;

  if (memberInfo && memberInfo.classList.contains("memberInfo")) {
    if (memberInfo.style.display === "none") {
      memberInfo.style.display = "flex";
      imgElement.src = "../../assets/icons/upperVector.png";
    } else {
      memberInfo.style.display = "none";
      imgElement.src = "../../assets/icons/vector.png";
    }
  }
}
//편집버튼 눌었을시 부서추가 버튼 보이게 + deleteBtn보이게
document.getElementById("reviseBtn").onclick = function () {
  var deleteBtns = document.querySelectorAll(".deleteBtn");
  deleteBtns.forEach(function (btn) {
    btn.style.display = "inline"; // deleteBtn 보이게
  });
  var deptAdd = document.getElementById("deptAdd");
  deptAdd.style.display = "block";
  var addBtn = document.querySelector(".addBtn");
  addBtn.style.display = "inline";
  var clubPic = document.querySelector(".clubPic");
  clubPic.style.opacity = "0.8";
  clubPic.style.filter = "blur(3px)";
  var vectorBtns=document.querySelectorAll('.vector');
  vectorBtns.forEach(function(btn){
    var srcValue = btn.src;
    var parts = srcValue.split('/');
    parts[parts.length - 1] = 'starBtn.png';
    var newSrc=parts.join('/');
    btn.src=newSrc;
  })
};
// 부서 추가 기능 및 삭제 기능
document.getElementById("deptAdd").onclick = function () {
  // 새로운 부서 항목을 템플릿 리터럴로 작성
  var newDeptHTML = `
  <hr>
    <div class="clubDept">
     <div class="clubinnerDept">
        <img style="width: 15px; height: 15px;" class="deleteBtn" src="../../assets/icons/deleteBtn.png">
          <p>부서명을 입력해주세요</p>
      </div>
      <img class="starBtn" src="../../assets/icons/starBtn.png">
          </div>
          `;
  document.querySelector(".NewDept").innerHTML += newDeptHTML;//추가
};

// 이벤트 위임: .NewDept에 이벤트 리스너 추가
document.querySelector(".NewDept").addEventListener("click", function (e) {
  // 삭제 버튼 클릭 시
  if (e.target.classList.contains("deleteBtn")) { 
    const clubDept = e.target.closest(".clubDept");
    if (clubDept) { 
      const hrElement = clubDept.previousElementSibling;
      if (hrElement && hrElement.tagName === 'HR') {
        hrElement.remove();
      }
      clubDept.remove();
    }
  }
  // 스타 버튼 클릭 시
  if (e.target.classList.contains("starBtn")) {
    const starImg = e.target;
    if (starImg.src.includes("starBtn.png")) {
      starImg.src = "../../assets/icons/checked_starBtn.png";
    } else {
      starImg.src = "../../assets/icons/starBtn.png"; 
    }
  }
});

const deleteButtons = document.querySelectorAll('.deleteBtn');
deleteButtons.forEach(button => {
  button.onclick = function () {
    // 상위 div 요소 가져오기
    const parentDiv = this.closest('div');
    const modalHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <p>탈퇴시키겠습니까?</p>
          <p>(탈퇴사유: 퇴학)</p>
          <div class='modalBtn'> 
          <button class="cancel-delete">취소</button>
          <button class="confirm-delete">탈퇴</button></div>
          </div>
        </div>
      </div>
    `;
    // body에 모달삽입
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const bodyElements = document.querySelectorAll("body *:not(.modal):not(.modal-overlay):not(.modal *)");
    bodyElements.forEach(element => {
      element.style.filter = `blur(1px) `;
   
    });
  

    //확인버튼클릭
    const modal = document.querySelector('.modal-overlay');
    modal.querySelector('.confirm-delete').onclick = function () {

      const hrElement = parentDiv.previousElementSibling;
      if (hrElement && hrElement.tagName === 'HR') {
        hrElement.remove(); // <hr> 삭제
      }
      parentDiv.remove(); // 상위 div 삭제
      modal.remove(); // 모달 제거
      //화면 흐림 멈춤
      bodyElements.forEach(element => {
        element.style.filter = ``;
      });

    };
    // 취소버튼클릭
    modal.querySelector('.cancel-delete').onclick = function () {
      modal.remove(); // 모달 제거
     // 화면흐림 멈춤
     bodyElements.forEach(element => {
      element.style.filter = ``;
    });

    };
  };
});
