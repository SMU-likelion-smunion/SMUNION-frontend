const API_SERVER_DOMAIN = "https://smunion.shop";
const accessToken = getCookie("accessToken");

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

document.addEventListener("DOMContentLoaded", () => {
  const prevScreen = document.querySelector(".prev-screen");
  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector(".cal-top-header img:first-child");
  const nextBtn = document.querySelector(".cal-top-header img:last-child");
  const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  function renderCalendar() {
    calDates.innerHTML = ""; //날짜 초기화
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();

    calHeader.textContent = `${year}년 ${month + 1}월 ${date}일`; //년 월 일

    const firstDay = new Date(year, month, 1).getDay(); //이번 달 첫째날 (요일 계산->시작위치 설정)
    const lastDay = new Date(year, month + 1, 0).getDate(); //이번 달 마지막 날짜 (일수 계산)
    const prevLastDate = new Date(year, month, 0).getDate(); //이전 달 마지막 날짜

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    //지난 달 날짜
    for (let i = 0; i < firstDay; i++) {
      let prevBlankDiv = document.createElement("div");
      prevBlankDiv.classList.add("prev-month");
      let prevBlankSpan = document.createElement("span");
      prevBlankSpan.textContent = prevLastDate - (firstDay - 1) + i;
      prevBlankDiv.appendChild(prevBlankSpan);
      calDates.appendChild(prevBlankDiv);
    }

    //이번 달 날짜 생성
    for (let i = 1; i <= lastDay; i++) {
      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");
      let spanElement = document.createElement("span");
      spanElement.textContent = i;

      //기본값으로 오늘 날짜 선택됨
      if (i === todayDate && year === todayYear && month === todayMonth) {
        dateDiv.classList.add("selected-date");
      }

      dateDiv.appendChild(spanElement);
      calDates.appendChild(dateDiv);

      // //날짜 클릭
      // dateDiv.addEventListener("click", () => {
      //   document.querySelectorAll(".selected-date").forEach((item) => {
      //     item.classList.remove("selected-date");
      //   });
      //   dateDiv.classList.add("selected-date");
      //   calHeader.textContent = `${year}년 ${month + 1}월 ${i}일`;
      // });

      // 날짜 클릭 이벤트
      dateDiv.addEventListener("click", function () {
        // 기존 선택된 날짜의 스타일 제거
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
        });

        // 현재 클릭한 날짜에 스타일 추가
        dateDiv.classList.add("selected-date");

        // 선택한 날짜 가져오기
        const selectedDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;

        // 캘린더 헤더 업데이트
        calHeader.textContent = `${year}년 ${month + 1}월 ${i}일`;

        // 선택한 날짜를 localStorage에 저장
        localStorage.setItem("selectedDate", selectedDate);
      });
    }

    //다음 달 날짜
    const remainDays = 7 - ((firstDay + lastDay) % 7);
    if (remainDays < 7) {
      for (let i = 1; i <= remainDays; i++) {
        let nextBlankDiv = document.createElement("div");
        nextBlankDiv.classList.add("next-month");
        let nextBlankSpan = document.createElement("span");
        nextBlankSpan.textContent = i;
        nextBlankDiv.appendChild(nextBlankSpan);
        calDates.appendChild(nextBlankDiv);
      }
    }

    //날짜 선택시 localStorage에 저장
    document.querySelectorAll(".dates").forEach((dateDiv) => {
      dateDiv.addEventListener("click", function (event) {
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
        });

        dateDiv.classList.add("selected-date");

        // 클릭한 날짜 가져오기 (event.target 사용)
        const selectedDay = event.target.textContent.trim();

        // 선택한 날짜를 YYYY-MM-DD 형식으로 저장
        const selectedDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${selectedDay.padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);
      });
    });
  }

  //이전 화면으로 이동
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  //이전 달 클릭 > 이동
  prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  //다음 달 클릭 > 이동
  nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  //새로운 공지 추가 클릭
  const addNotice = document.querySelector(".add-notice-box");
  if (addNotice) {
    addNotice.addEventListener("click", () => {
      location.href = "club-notice-create.html";
    });
  }

  renderCalendar();
});
