const API_SERVER_DOMAIN = "https://smunion.shop";

/* 쿠키 관련 함수들 */
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
}

//refreshToken 만료 시
function getRefreshToken() {
  const refreshToken = getCookie("refreshToken");

  fetch(API_SERVER_DOMAIN + `/api/v1/users/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        console.log("완료");

        //새 accessToken (2시간 유지)
        setCookie("accessToken", data.result.accessToken, 2);

        //새 refreshToken (7일 유지)
        setCookie("refreshToken", data.result.refreshToken, 168);

        console.log("New AccessToken:", data.result.accessToken);
        console.log("New RefreshToken:", data.result.refreshToken);

        getClubs();
      } else {
        console.error("만료");
      }
    })
    .catch((error) => console.error("오류 발생:", error));
}

document.addEventListener("DOMContentLoaded", () => {
  const prevScreen = document.querySelector(".prev-screen");
  //캘린더
  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector("#cal-top-header2 img:nth-of-type(1)");
  const nextBtn = document.querySelector("#cal-top-header2 img:nth-of-type(2)");
  const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  function renderCalendar() {
    calDates.innerHTML = ""; //날짜 초기화

    //시작 날짜 설정
    let firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay());

    //캘린더 헤더
    calHeader.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`; //년 월 일

    //날짜 생성
    for (let i = 0; i < 14; i++) {
      let createDate = new Date(firstDay);
      createDate.setDate(firstDay.getDate() + i);

      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");

      let spanElement = document.createElement("span");
      spanElement.textContent = createDate.getDate();

      //기본값으로 오늘 날짜 선택됨
      if (
        createDate.getFullYear() === today.getFullYear() &&
        createDate.getMonth() === today.getMonth() &&
        createDate.getDate() === today.getDate()
      ) {
        dateDiv.classList.add("selected-date");
      }

      dateDiv.appendChild(spanElement);
      calDates.appendChild(dateDiv);

      //날짜 클릭
      dateDiv.addEventListener("click", () => {
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
        });
        dateDiv.classList.add("selected-date");
        calHeader.textContent = `${createDate.getFullYear()}년 ${createDate.getMonth() + 1}월 ${createDate.getDate()}일`;

        const selectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);
      });
    }
  }

  //이전 화면으로 이동
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  //캘린더 '<' 버튼 클릭
  prevBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 14);
    renderCalendar();
  });

  //캘린더 '>' 버튼 클릭
  nextBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 14);
    renderCalendar();
  });

  renderCalendar();

  //'전체보기' 클릭
  document.getElementById("cal-view-all").addEventListener("click", function () {
    window.location.href = "/html/pages/club-full-calendar.html";
  });

  //'전체공지' 클릭
  const allNoticeBox = document.querySelector("#item1");
  if (allNoticeBox) {
    allNoticeBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'투표' 클릭
  const voteBox = document.querySelector("#item2");
  if (voteBox) {
    voteBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'회비/정산' 클릭
  const feeCalBox = document.querySelector("#item3");
  if (feeCalBox) {
    feeCalBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'출석' 클릭
  const attendBox = document.querySelector("#item4");
  if (attendBox) {
    attendBox.addEventListener("click", () => {
      window.location.href = "/html/pages/notice-all.html";
    });
  }

  //'동아리 체계' 클릭
  const clubSystemBox = document.querySelector("#item5");
  if (clubSystemBox) {
    clubSystemBox.addEventListener("click", () => {
      location.href = "clubHierarchy.html";
    });
  }

  //<관리자 권한> '생성' 클릭
  const noticeCreate = document.querySelector(".notice-create-btn");
  if (noticeCreate) {
    noticeCreate.addEventListener("click", () => {
      location.href = "club-notice-create.html";
    });
  }
});
