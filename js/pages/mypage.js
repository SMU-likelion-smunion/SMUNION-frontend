document.addEventListener("DOMContentLoaded", function () {
  const API_SERVER_DOMAIN = "https://smunion.shop";

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

  const accessToken = getCookie("accessToken");

  // 로그인 상태 확인
  if (!accessToken) {
    // 이미 로그인된 경우 홈 페이지로 리디렉션
    window.location.href = "/html/pages/login.html";
    return;
  }

  // 사용자 정보를 가져오는 함수
  function UserInfo() {
    var requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/users", requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess && data.result) {
          // 응답이 성공적이고 result가 존재할 경우
          const userData = data.result; // result 내부 데이터 저장

          const nameElement = document.querySelector(".profile-name");
          if (nameElement) {
            nameElement.textContent = userData.name || "이름없음";
          }

          const majorElement = document.querySelector(".profile-major");
          if (majorElement) {
            majorElement.textContent = userData.major || "전공없음";
          }

          const snoElement = document.querySelector(".profile-sno");
          if (snoElement) {
            snoElement.textContent = userData.studentNumber || "학번없음";
          }
        } else {
          console.log("유효한 사용자 정보가 없습니다.");
        }
      })
      .catch((error) => console.log("error", error));
  }

  UserInfo();

  // 프로필 사진 변경 함수

  const profileImage = document.querySelector(".profile-img");

  // 프로필 사진 변경 모달  변수
  const editProfileModal = document.querySelector(
    ".edit-profile-modal-container"
  );
  const editProfileModalTriggers = document.querySelector(".edit-profile-btn");
  const editProfileModalImageBtn = document.querySelector(
    ".edit-profile-modal-image"
  );
  const editProfileModalDefaultBtn = document.querySelector(
    ".edit-profile-modal-default"
  );

  // 프로필 사진 변경 모달 열기
  editProfileModalTriggers.addEventListener("click", () => {
    editProfileModal.style.display = "flex";
  });

  // 1. 프로필 이미지 불러오기 (로컬스토리지 → 없으면 API 호출)
  function loadProfileImage() {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) {
      profileImage.src = savedImage; // 로컬 저장된 이미지 적용
    } else {
      fetchUserProfileImage(); // API 호출하여 가져오기
    }
  }

  // 2. 서버에서 사용자 프로필 이미지 가져오기
  function fetchUserProfileImage() {
    fetch(API_SERVER_DOMAIN + "/api/v1/users/profile-image", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.isSuccess && result.result.profileImage) {
          profileImage.src = result.result.profileImage;
          localStorage.setItem("profileImage", result.result.profileImage); // 로컬스토리지에 저장
        } else {
          console.error("프로필 이미지 불러오기 실패:", result.message);
        }
      })
      .catch((error) => {
        console.error("API 요청 오류:", error);
      });
  }

  loadProfileImage(); // 페이지 로드 시 프로필 이미지 적용

  // 3. 프로필 이미지 업로드 함수
  function uploadProfileImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    fetch(API_SERVER_DOMAIN + "/api/v1/users/profile-image", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.isSuccess) {
          profileImage.src = result.result.profileImage;
          localStorage.setItem("profileImage", result.result.profileImage); // 로컬스토리지에 저장
        } else {
          console.error("프로필 이미지 업데이트 실패:", result.message);
        }
      })
      .catch((error) => {
        console.error("API 요청 오류:", error);
      });
  }

  // 4. 프로필 사진 변경 이벤트 (파일 선택 후 업로드)
  editProfileModalImageBtn.addEventListener("click", function () {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.click();

    fileInput.addEventListener("change", function () {
      const file = fileInput.files[0];
      if (file) {
        uploadProfileImage(file); // 업로드 함수 호출
      }
    });

    // 모달 닫기
    editProfileModal.style.display = "none";
  });

  // 5. 프로필 사진 삭제 (기본 이미지 적용)

  // 기본 이미지 적용 버튼 클릭 이벤트
  editProfileModalDefaultBtn.addEventListener("click", function () {
    fetch(API_SERVER_DOMAIN + "/api/v1/users/profile-image", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.isSuccess) {
          // 로컬스토리지에서 프로필 이미지 제거
          localStorage.removeItem("profileImage");

          // 기본 프로필 이미지 적용
          profileImage.src = "../../assets/images/default-profile-image.png";

          // 모달 닫기
          editProfileModal.style.display = "none";
        } else {
          console.error("프로필 이미지 삭제 실패:", result.message);
        }
      })
      .catch((error) => {
        console.error("API 요청 오류:", error);
      });
  });

  //동아리 프로필 변경

  // 동아리 프로필 변경 모달 변수
  const ChangeClubModal = document.querySelector(".club-change-container");
  const ChangeClubModalTriggers = document.querySelector(".club-change");

  // 동아리 프로필 변경 모달 열기
  ChangeClubModalTriggers.addEventListener("click", () => {
    ChangeClubModal.style.display = "flex";
  });

  // 로그아웃

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

  // 동아리 탈퇴 요청

  // 동아리 탈퇴 요청 모달 변수
  const leaveClubModal = document.querySelector(".leave-club-modal-container");
  const leaveClubModalTriggers = document.querySelector(".leave-club-request");
  const leaveClubModalCancelBtn = document.querySelector(
    ".leave-club-modal-cancel"
  );
  const leaveClubModalRequestBtn = document.querySelector(
    ".leave-club-modal-request"
  );

  // 동아리 탈퇴 요청 모달 열기
  leaveClubModalTriggers.addEventListener("click", () => {
    leaveClubModal.style.display = "flex";
  });

  // 동아리 탈퇴 요청 모달 닫기
  leaveClubModalCancelBtn.addEventListener("click", () => {
    leaveClubModal.style.display = "none";
  });

  // //동아리 탈퇴 처리
  // leaveClubModalRequestBtn.addEventListener("click", () => {
  //   leaveClub();
  // });

  //계정 탈퇴

  // 계정 탈퇴 모달 관련 변수
  const deleteAccountModal = document.querySelector(
    ".delete-account-modal-container"
  );
  const deleteAccountModalTriggers = document.querySelector(".delete-account");
  const deleteAccountModalCancelBtn = document.querySelector(
    ".delete-account-modal-cancel"
  );
  const deleteAccountModalRequestBtn = document.querySelector(
    ".delete-account-modal-request"
  );

  // 계정 탈퇴 모달 열기
  deleteAccountModalTriggers.addEventListener("click", () => {
    deleteAccountModal.style.display = "flex";
  });

  // 계정 탈퇴 모달 닫기
  deleteAccountModalCancelBtn.addEventListener("click", () => {
    deleteAccountModal.style.display = "none";
  });

  //계정 탈퇴 처리
  deleteAccountModalRequestBtn.addEventListener("click", () => {
    deleteAccount();
  });

  // 계정 탈퇴 API 호출

  // var data = JSON.stringify({
  //   email,
  //   password,
  // });

  function deleteAccount(email, password) {
    const data = JSON.stringify({ email, password });

    var requestOptions = {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/users/delete", requestOptions)
      .then((response) => {
        if (response.status === 200) {
          // 성공적으로 삭제되었지만 내용이 없는 경우
          return { success: true, message: "회원 탈퇴가 완료되었습니다." };
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log("회원 탈퇴 결과:", result);
        alert(
          result.message ||
            "회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다."
        );
        // 로그아웃 처리 (쿠키 삭제)
        document.cookie =
          "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // 로그인 페이지로 리다이렉트
        window.location.href = "../../html/pages/login.html";
      })
      .catch((error) => {
        console.error("Error:", error);
        if (error.name === "SyntaxError") {
          // JSON 파싱 오류가 발생했지만, 실제로는 작업이 성공했을 수 있음
          alert(
            "회원 탈퇴가 처리되었을 수 있습니다. 로그아웃 후 다시 로그인을 시도해주세요."
          );
          // 로그아웃 처리 (쿠키 삭제)
          document.cookie =
            "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          // 로그인 페이지로 리다이렉트
          window.location.href = "../../html/pages/login.html";
        } else {
          alert("회원 탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      });
  }
});
