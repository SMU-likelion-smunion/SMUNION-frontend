const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");
 let refreshToken = getCookie("refreshToken");

function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}



document.querySelector('.createBtn').addEventListener('click', function () {
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0]; 
  if (file) {
    const reader = new FileReader(); 
    reader.onload = function (e) {
      const preview = document.createElement('img'); 
      preview.src = e.target.result; 
      preview.className = 'preview'; 
      const uploadContainer = document.querySelector('.uploadPic');
      uploadContainer.innerHTML = '';
      uploadContainer.appendChild(preview);
    };
    reader.readAsDataURL(file); 
  }
});

const nameInput = document.querySelector('.content input:nth-of-type(1)');
const explanationInput = document.querySelector('.content input:nth-of-type(2)');
const fileInput = document.getElementById('fileInput');
const BASE_URL = 'https://smunion.shop/api/v1';
const CLUB_URI = '/club';

// 동아리 생성 데이터를 서버에 전송
function sendClubData(jsonData,token) {
  fetch(`${BASE_URL}${CLUB_URI}`, {
    method: 'POST', 
    headers: {
      Authorization: `Bearer ${token}`,
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
    const clubImage = reader.result; 
    const clubData = {
      name: nameInput.value.trim(), 
      explanation: explanationInput.value.trim(), 
      clubImage: clubImage, 
    };

    sendClubData(clubData);
    console.log(clubData)
  };
  reader.readAsDataURL(fileInput.files[0]); 
});
