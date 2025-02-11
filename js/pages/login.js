document.addEventListener("DOMContentLoaded", function () {
  const API_SERVER_DOMAIN = "https://smunion.shop";

  // 쿠키 관련 함수
  function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  }

  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value}${expires}; path=/`;
  }

  // function deleteCookie(name) {
  //   document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;`;
  // }

  // 초기화: 상태 정리 및 로그인 상태 확인
  const accessToken = getCookie("accessToken");

  if (accessToken) {
    // 이미 로그인된 경우 홈 페이지로 리디렉션
    window.location.href = "/html/pages/home.html";
    return;
  }

  // 로그인 폼 제출 처리 함수
  function submitLoginForm(event) {
    event.preventDefault(); // 기본 제출 동작 방지

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("pw").value.trim();
    const errorMessage = document.querySelector(
      ".error-message-container .error-message"
    );

    // 에러 메시지 초기화
    errorMessage.style.display = "none";

    // 유효성 검사
    if (!email || !password) {
      errorMessage.textContent = "이메일과 비밀번호를 입력해주세요.";
      errorMessage.style.display = "block";
      return;
    }

    // JSON 객체 생성
    const data = JSON.stringify({
      email: email,
      password: password,
    });

    // 서버에 로그인 요청
    fetch(`${API_SERVER_DOMAIN}/api/v1/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(errorData.message || "Login failed");
          });
        }
        return response.json();
      })
      .then((data) => {
        // 로그인 성공 처리
        var accessToken = data.result.accessToken;
        var refreshToken = data.result.refreshToken;

        // Bearer 제거하고 토큰 값만 추출
        if (accessToken.startsWith("Bearer ")) {
          accessToken = accessToken.substring(7); // "Bearer " 이후의 문자열 추출
        }

        // 쿠키에 저장
        setCookie("accessToken", accessToken, 1);
        setCookie("refreshToken", refreshToken, 1);
        window.location.replace("home.html");
      })
      .catch((error) => {
        errorMessage.textContent = error.message;
        errorMessage.style.display = "block";
        console.error(error);
      });
  }

  // 초기 에러 메시지 숨기기
  const errorMessage = document.querySelector(".error-message");
  if (errorMessage) errorMessage.style.display = "none";

  // 로그인 버튼에 이벤트 리스너 추가
  document
    .querySelector(".login-btn")
    .addEventListener("click", submitLoginForm);
});
