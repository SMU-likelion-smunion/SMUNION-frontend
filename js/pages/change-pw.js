document.addEventListener("DOMContentLoaded", function () {
  var API_SERVER_DOMAIN = "https://smunion.shop";

  // 쿠키 가져오기 함수
  function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  }

  const accessToken = getCookie("accessToken");

  // 로그인 상태 확인
  if (!accessToken) {
    // 이미 로그인된 경우 홈 페이지로 리디렉션
    window.location.href = "/html/pages/login.html";
    return;
  }

  // 비밀번호 변경 함수
  function changePassword(event) {
    event.preventDefault();

    var currentPassword = document.getElementById("current-pw").value.trim();
    var newPassword = document.getElementById("new-pw").value.trim();
    var confirmPassword = document.getElementById("new-pw-check").value.trim();

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      window.location.replace("/html/pages/login.html");
      return;
    }

    var data = JSON.stringify({
      currentPassword: currentPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    });

    const requestOptions = {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: data,
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/users/password", requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(JSON.stringify(data));
          });
        }
        return response.json();
      })
      .then((result) => {
        console.log("비밀번호 변경 성공 :", result);
        alert("비밀번호 변경이 완료되었습니다.");
        window.location.replace("/html/pages/mypage.html");
      })
      .catch((error) => {
        console.error("비밀번호 변경 중 오류 발생 :", error.message);
        const errorData = JSON.parse(error.message); // 문자열을 객체로 변환
        alert("비밀번호 변경에 실패했습니다 : " + errorData.message);
      });
  }

  // 로그아웃 버튼에 이벤트 리스너 추가
  document
    .querySelector(".submit-btn")
    .addEventListener("click", changePassword);
});
