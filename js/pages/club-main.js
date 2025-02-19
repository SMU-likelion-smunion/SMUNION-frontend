const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");

function getToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

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

function getDepartmentName() {
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("data", data);

      if (data.isSuccess) {
        console.log("getDepartmentName 완료");

        const departmentName = data.result.departmentName; //departmentName 가져오기
        localStorage.setItem("departmentName", departmentName);
        console.log(departmentName);
      } else {
        throw new Error("부서 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

function getClubDetail() {
  // let accessToken = getCookie("accessToken");
  //console.log("getClubDetail 부분: ", accessToken);

  return fetch(API_SERVER_DOMAIN + `/api/v1/club/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess) {
        console.log("동아리 전체 공지: ", data.result);
        const {
          basicNoticeDetailResponseList = [],
          attendanceDetailResponseList = [],
          feeNoticeResponseList = [],
          voteResponseList = [],
        } = data.result;

        return [
          ...basicNoticeDetailResponseList,
          ...attendanceDetailResponseList,
          ...feeNoticeResponseList,
          ...voteResponseList,
        ];
      } else {
        throw new Error("failed");
      }
    })
    .catch((error) => console.error("Error club detail:", error));
}

// function filterNoticeByDepartmentAndDate(clubNotice, departmentName, selectedDate) {
//   console.log("target: ", departmentName);
//   console.log("date: ", selectedDate);

//   const {
//     basicNoticeDetailResponseList = [],
//     attendanceDetailResponseList = [],
//     feeNoticeResponseList = [],
//     voteResponseList = [],
//   } = clubNotice;

//   //모든 공지 -> 배열
//   // const allNotices = [
//   //   ...basicNoticeDetailResponseList,
//   //   ...attendanceDetailResponseList,
//   //   ...feeNoticeResponseList,
//   //   ...voteResponseList,
//   // ];

//   return allNotices.filter((notice) => {
//     const checkDepartment = notice.target === "전체" || notice.target === departmentName;
//     console.log(`부서 비교: ${notice.target} === ${departmentName} -> ${checkDepartment}`);

//     const checkDate = selectedDate ? isSameDate(notice.date, selectedDate) : true;
//     console.log(`날짜 비교: ${notice.date} === ${selectedDate} -> ${checkDate}`);

//     console.log("최종 필터링", checkDepartment && checkDate);

//     return checkDepartment && checkDate;
//   });
// }

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();
  console.log(accessToken);

  let allNotices = [];

  getDepartmentName(); //departmentName 가져오기

  getClubDetail().then((notices) => {
    allNotices = notices || [];
    console.log("line 152", allNotices);
    renderCalendar(allNotices);
  });

  const prevScreen = document.querySelector(".prev-screen");

  //캘린더
  //캘린더 헤더 날짜
  //const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector("#cal-top-header2 img:nth-of-type(1)");
  const nextBtn = document.querySelector("#cal-top-header2 img:nth-of-type(2)");
  //const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  function renderCalendar(allNotices) {
    console.log("가져온 allNotices", allNotices);
    const today = new Date();

    const calHeader = document.querySelector(".cal-top-header h1");
    const calDates = document.querySelector(".cal-dates");
    calDates.innerHTML = ""; //날짜 초기화

    //시작 날짜 설정
    let firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay());

    //캘린더 헤더
    calHeader.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`; //년 월 일

    const userDepartment = localStorage.getItem("departmentName");

    //날짜 생성
    for (let i = 0; i < 14; i++) {
      let createDate = new Date(firstDay);
      createDate.setDate(firstDay.getDate() + i);

      let spanElement = document.createElement("span");
      spanElement.textContent = createDate.getDate();

      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");
      dateDiv.appendChild(spanElement);

      /// 공지 추가
      const noticeList = document.createElement("div");
      noticeList.classList.add("todo-list");

      // 공지 데이터 순회
      let count = 0; // 최대 3개까지 공지 표시
      for (let i = 0; i < allNotices.length; i++) {
        const notice = allNotices[i];

        // 공지 날짜와 부서 체크
        const noticeDate = new Date(notice.date);
        const isSameDate =
          createDate.getFullYear() === noticeDate.getFullYear() &&
          createDate.getMonth() === noticeDate.getMonth() &&
          createDate.getDate() === noticeDate.getDate();
        const isTargetMatching = notice.target === "전체" || notice.target === userDepartment;

        // 조건에 맞으면 공지 추가
        if (isSameDate && isTargetMatching && count < 3) {
          const todoItem = document.createElement("p");
          todoItem.textContent = notice.title; // 공지의 title을 표시
          noticeList.appendChild(todoItem);
          count++; // 추가된 공지 개수 증가
        }

        // 만약 3개 공지가 추가되면 더 이상 추가하지 않음
        if (count >= 3) break;
      }

      dateDiv.appendChild(noticeList);
      calDates.appendChild(dateDiv);

      //날짜 클릭
      dateDiv.addEventListener("click", () => {
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
          item.querySelectorAll(".todo-list p").forEach((p) => {
            p.style.backgroundColor = "#0E207F";
          });
        });
        dateDiv.classList.add("selected-date");
        calHeader.textContent = `${createDate.getFullYear()}년 ${createDate.getMonth() + 1}월 ${createDate.getDate()}일`;

        const selectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);

        dateDiv.querySelectorAll(".todo-list p").forEach((p) => {
          p.style.backgroundColor = "rgba(256, 256, 256, 0.3)";
        });
      });

      //기본값으로 오늘 날짜 선택됨
      if (
        createDate.getFullYear() === today.getFullYear() &&
        createDate.getMonth() === today.getMonth() &&
        createDate.getDate() === today.getDate()
      ) {
        dateDiv.classList.add("selected-date");
        dateDiv.querySelectorAll(".todo-list p").forEach((p) => {
          p.style.backgroundColor = "rgba(256, 256, 256, 0.3)";
        });
      }
    }
  }

  //이전 화면으로 이동
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  //캘린더 '<' 버튼 클릭
  prevBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 14);
    renderCalendar(allNotices);
  });

  //캘린더 '>' 버튼 클릭
  // nextBtn.addEventListener("click", () => {
  //   currentDate.setDate(currentDate.getDate() + 14);
  //   renderCalendar(allNotices);
  // });

  //test
  nextBtn.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 14);
    getClubDetail().then((notices) => {
      renderCalendar(allNotices);
    });
  });

  renderCalendar(allNotices);

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

  //갤러리
  fetch(API_SERVER_DOMAIN + `/api/v1/gallery/getAll`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      console.log("gallery data", data);

      if (data.isSuccess && data.result && data.result.galleryResDTOS) {
        console.log("gallery data 조회 성공");

        data.result.galleryResDTOS.forEach((item) => {
          const galleryId = item.galleryID;
          const name = item.name;
          const thumbnail = item.thumbnailImages.length > 0 ? item.thumbnailImages[0] : null;

          const galleryItem = `
						<div class="gallery-items" data-gallery-id="${galleryId}">
							<img src="${thumbnail}" />
							<img src="/assets/icons/rectangle2.svg" />
							<p>${name}</p>
							<img src="/assets/icons/Forth.svg" />
						</div>
					`;
          document.querySelector(".gallery-content").insertAdjacentHTML("beforeend", galleryItem);
        });

        // 갤러리 클릭 시
        document.querySelectorAll(".gallery-items").forEach((item) => {
          item.addEventListener("click", function () {
            const galleryId = this.dataset.galleryId;
            localStorage.setItem("selectedGalleryId", galleryId);
            window.location.href = `/html/pages/gallery.html?id=${galleryId}`;
          });
        });
      } else {
        throw new Error("갤러리 데이터 조회 실패");
      }
    })
    .catch((error) => {
      console.error("Error fetching gallery data:", error);
    });
});
