document.querySelector('.createBtn').addEventListener('click', function () {
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0]; // 업로드한 파일 가져오기
  if (file) {
    const reader = new FileReader(); // 파일 읽기 객체 생성
    reader.onload = function (e) {// 로드 되면 실행 
      const preview = document.createElement('img'); 
      preview.src = e.target.result; // 파일 데이터를 이미지로 설정
      preview.className = 'preview'; 
      const uploadContainer = document.querySelector('.uploadPic');
      uploadContainer.innerHTML = '';
      uploadContainer.appendChild(preview);
    };
    reader.readAsDataURL(file); // 파일을 읽어 데이터 URL로 변환
  }
});

// 입력 필드 파일 업로드 필드
const nameInput = document.querySelector('.content input:nth-of-type(1)');
const explanationInput = document.querySelector('.content input:nth-of-type(2)');
const fileInput = document.getElementById('fileInput');
const BASE_URL = 'https://sumnion.shop/api/v1';
const CLUB_URI = '/club';
// 동아리 생성 데이터를 서버에 전송
function sendClubData(jsonData) {
  fetch(`${BASE_URL}${CLUB_URI}`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json', 
    },
    body: JSON.stringify(jsonData), 
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        alert('동아리 생성에 성공했습니다!');
        window.location.href = 'clubWaitApproval.html';
      } else {
        alert(data.message || '동아리 생성에 실패했습니다.');
      }
    })
    .catch((error) => {
      console.error('에러 발생:', error);
      alert('서버와의 통신 중 오류가 발생했습니다.');
    });
}
// "완료" 버튼 클릭
document.querySelector('.reviseBtn button:nth-of-type(2)').addEventListener('click', () => {
  if (!nameInput.value.trim() || !explanationInput.value.trim()) {
    alert('동아리명과 설명을 모두 입력해주세요.');
    return;
  }
  if (!fileInput.files[0]) {
    alert('이미지를 업로드해주세요.');
    return;
  }
  // 파일을 읽어 Base64로 변환
  const reader = new FileReader();
  reader.onload = () => {
    const clubImage = reader.result; // Base64로 인코딩된 이미지 데이터
    // 서버에 전송할 JSON 데이터 생성
    const clubData = {
      name: nameInput.value.trim(), // 동아리명
      explanation: explanationInput.value.trim(), // 동아리 설명
      clubImage: clubImage, // Base64 이미지
    };
    // 데이터 전송
    sendClubData(clubData);
  };
  reader.readAsDataURL(fileInput.files[0]); // 파일 읽기
});
