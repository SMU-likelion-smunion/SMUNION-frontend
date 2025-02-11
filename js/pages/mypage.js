document.addEventListener("DOMContentLoaded", function () {
  const API_SERVER_DOMAIN = "https://smunion.shop";

  // 모달 관련 변수
  const deleteAccountModal = document.querySelector(".mypage-alert-container");
  const modalTriggers = document.querySelectorAll(
    ".leave-club-request, .delete-account"
  );
  const cancelBtn = document.querySelector(".cancel");
  const deleteAccountdBtn = document.querySelector(".request");

  // 모달 열기
  modalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      deleteAccountModal.style.display = "flex";
    });
  });

  // 모달 닫기
  [cancelBtn, deleteAccountdBtn].forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteAccountModal.style.display = "none";
    });
  });

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

  // 쿠키 삭제 함수
  function deleteCookie(name) {
    document.cookie =
      name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
  }

  // 클라이언트 상태 초기화 함수
  function clearClientState() {
    deleteCookie("accessToken");
    sessionStorage.removeItem("isLogin");
    localStorage.clear();
    sessionStorage.clear();
  }

  // 로그아웃 함수
  function logout(event) {
    event.preventDefault();
    clearClientState();

    var logoutBtn = document.querySelector(".logout a");

    const accessToken = getCookie("accessToken");
    if (!accessToken) {
      alert("로그인 세션이 만료되었습니다.");
      window.location.replace("/html/pages/login.html");
      return;
    }

    const requestOptions = {
      method: "POST",
      headers: {
        Authorization: accessToken,
        "Content-Type": "application/json",
      },
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/users/logout", requestOptions)
      .then((response) => {
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            alert("세션이 만료되었습니다. 다시 로그인해주세요.");
            window.location.replace("/html/pages/login.html");
            return;
          }
          return response.text().then((errorData) => {
            throw new Error(
              `서버 로그아웃 요청 실패: ${response.status} - ${errorData}`
            );
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("로그아웃 성공:", data);
        deleteCookie("accessToken"); // 성공 후 쿠키 삭제
        localStorage.clear();
        sessionStorage.clear();
        alert("로그아웃되었습니다.");
        window.location.replace("/html/pages/login.html");
      })
      .catch((error) => {
        console.error("로그아웃 중 오류 발생:", error.message);
        alert("로그아웃 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
      });
  }

  // 로그아웃 버튼에 이벤트 리스너 추가
  document.querySelector(".logout a").addEventListener("click", logout);
});
