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

let allNotices = [];
let filteredAllNotices = [];

async function fetchAllClubNotices() {
  let accessToken = getCookie("accessToken");

  try {
    // 1️⃣ 모든 동아리의 memberClubId 가져오기
    let clubsResponse = await fetch(API_SERVER_DOMAIN + "/api/v1/users/clubs", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let clubsData = await clubsResponse.json();
    if (!clubsData.isSuccess) throw new Error("Failed to fetch clubs");

    let clubList = clubsData.result;

    // 2️⃣ 각 동아리 memberClubId를 순회하면서 공지 가져오기
    for (let club of clubList) {
      let memberClubId = club.memberClubId;
      let department = club.departmentName; // 사용자 부서 정보 (API에서 제공된다면)

      // 2-1. 특정 동아리 세션 선택 (POST 요청)
      await fetch(`${API_SERVER_DOMAIN}/api/v1/users/clubs/select?memberClubId=${memberClubId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // 2-2. 해당 동아리의 공지사항 조회 (GET 요청)
      let detailResponse = await fetch(`${API_SERVER_DOMAIN}/api/v1/club/detail`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      let detailData = await detailResponse.json();
      if (!detailData.isSuccess) throw new Error("Failed to fetch club details");

      let clubNotices = extractNotices(detailData.result, memberClubId, department);
      allNotices.push(...clubNotices);
    }

    //console.log("모든 공지 데이터:", allNotices);
    return allNotices;
  } catch (error) {
    console.error("Error fetching all notices:", error);
  }
}

//공지 데이터 가공 함수
function extractNotices(clubData, memberClubId, department) {
  let notices = [];
  let clubName = clubData.name;

  // 공지 리스트를 처리하는 함수
  function formatNotices(list, type) {
    return list.map((notice) => {
      let noticeId;

      // 각 공지 유형에 맞는 ID 추출
      switch (type) {
        case "basic":
          noticeId = notice.noticeId;
          break;
        case "attendance":
          noticeId = notice.attendanceId;
          break;
        case "fee":
          noticeId = notice.feeId;
          break;
        case "vote":
          noticeId = notice.voteId;
          break;
        default:
          noticeId = null;
          break;
      }

      return {
        id: noticeId, // 공지 ID 추가
        date: type === "fee" ? notice.deadline : notice.date,
        clubName,
        memberClubId,
        department,
        type,
        title: notice.title,
        target: notice.target,
      };
    });
  }
  // 각 공지 리스트에 대해 ID를 설정하고 notices 배열에 추가
  notices.push(...formatNotices(clubData.basicNoticeDetailResponseList, "basic"));
  notices.push(...formatNotices(clubData.attendanceDetailResponseList, "attendance"));
  notices.push(...formatNotices(clubData.feeNoticeResponseList, "fee"));
  notices.push(...formatNotices(clubData.voteResponseList, "vote"));

  return notices;
}

function formatNotices(list, type) {
  return list.map((notice) => {
    // 각 공지의 ID를 적절히 할당
    let noticeId;
    switch (type) {
      case "basic":
        noticeId = notice.noticeId;
        break;
      case "attendance":
        noticeId = notice.attendanceId;
        break;
      case "fee":
        noticeId = notice.feeId;
        break;
      case "vote":
        noticeId = notice.voteId;
        break;
    }
    //console.log("noticeId", noticeId);

    return {
      id: noticeId, // 공지 ID 추가
      date: type === "fee" ? notice.deadline : notice.date, // fee는 deadline, 다른 공지는 date
      clubName,
      memberClubId,
      department,
      type,
      title: notice.title,
      target: notice,
      target,
    };
  });
}

//allNotices -> target 필터링
function filterNoticesByDepartment(allNotices) {
  filteredAllNotices = allNotices.filter((notice) => {
    if (notice.target === "전체") {
      return true;
    }

    return notice.target.includes(notice.department);
  });
  //console.log("target 필터링된 공지", filteredAllNotices);
}

//체크리스트 공지
function displayNoticesForDate(dateStr) {
  //console.log("191", dateStr);

  const checkListHeader = document.querySelector(".check-list-header");
  checkListHeader.querySelectorAll(".items").forEach((item) => item.remove()); // 기존 공지 삭제

  let noticesForDate = filteredAllNotices.filter((notice) => {
    //console.log(notice);

    return notice.date && notice.date.slice(0, 10) === dateStr;
  });
  //console.log("dateStr 비교", noticesForDate);

  noticesForDate.forEach((notice) => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("items");
    itemDiv.setAttribute("data-club-id", notice.memberClubId);
    itemDiv.setAttribute("data-notice-id", notice.id);
    itemDiv.innerHTML = `
      <div class="club-name">${notice.clubName}</div>
      <div><img class="rec1" src="/assets/icons/rectangle1.svg" /></div>
      <div>${notice.title}</div>
      <div><img src="/assets/icons/Forth.svg" /></div>
    `;

    //공지 클릭 -> 상세 공지로 이동
    itemDiv.addEventListener("click", () => {
      const clubId = itemDiv.getAttribute("data-club-id");
      const noticeId = itemDiv.getAttribute("data-notice-id");

      let noticeUrl;
      if (notice.type === "basic") {
        noticeUrl = `notice-view-default.html?id=${noticeId}`;
      } else if (notice.type === "fee") {
        noticeUrl = `notice-view-fee.html?id=${noticeId}`;
      } else if (notice.type === "attendance") {
        noticeUrl = `notice-view-attendance.html?id=${noticeId}`;
      } else if (notice.type === "vote") {
        noticeUrl = noticeUrl = `notice-view-vote.html?id=${noticeId}`;
      } else {
        console.log("failed to create noticeUrl");
      }

      //특정 동아리 선택
      fetch(`${API_SERVER_DOMAIN}/api/v1/users/clubs/select?memberClubId=${clubId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })
        .then(() => {
          //상세공지 이동
          window.location.href = noticeUrl;
        })
        .catch((error) => console.error("동아리 선택 API 호출 오류:", error));
    });

    checkListHeader.appendChild(itemDiv);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!accessToken) {
    console.warn("AccessToken 없음. 로그인 페이지로 이동.");
    window.location.href = "/login.html";
    return;
  }

  console.log(accessToken);

  // 모든 공지를 가져오는 함수 호출
  try {
    const allNotices = await fetchAllClubNotices(); // 모든 공지 데이터를 가져옴
    //console.log("line 165:", allNotices); // 공지 데이터 확인용 로그 출력
    filterNoticesByDepartment(allNotices);
    //console.log("부서 필터링 된 데이터", filteredAllNotices);
  } catch (error) {
    console.error("공지 데이터를 가져오는 중 에러 발생:", error);
  }

  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top h1");
  const prevBtn = document.querySelector("#home-cal-top img:nth-of-type(1)");
  const nextBtn = document.querySelector("#home-cal-top img:nth-of-type(2)");
  const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  localStorage.setItem("selectedDate", todayStr);

  renderCalendar();

  function renderCalendar() {
    calDates.innerHTML = ""; //날짜 초기화

    //시작 날짜 설정
    let firstDay = new Date(currentDate);
    firstDay.setDate(currentDate.getDate() - currentDate.getDay());

    //캘린더 헤더
    calHeader.textContent = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`; //년 월 일

    const selectedDate = localStorage.getItem("selectedDate");

    //날짜 생성
    for (let i = 0; i < 14; i++) {
      let createDate = new Date(firstDay);
      createDate.setDate(firstDay.getDate() + i);

      let dateStr = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
      //console.log("dateStr", dateStr);

      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");

      let spanElement = document.createElement("span");
      spanElement.textContent = createDate.getDate();

      // 공지 리스트 추가
      let todoListDiv = document.createElement("div");
      todoListDiv.classList.add("todo-list");

      // 해당 날짜에 맞는 공지 필터링
      let noticesForDate = filteredAllNotices.filter((notice) => {
        let noticeDate = new Date(notice.date);
        let formattedNoticeDate = `${noticeDate.getFullYear()}-${String(noticeDate.getMonth() + 1).padStart(2, "0")}-${String(noticeDate.getDate()).padStart(2, "0")}`;

        return formattedNoticeDate === dateStr;
      });

      //console.log("날짜 필터링", noticesForDate);

      // 최대 3개의 공지만 표시
      let displayedNotices = noticesForDate.slice(0, 3);

      displayedNotices.forEach((notice) => {
        let pElement = document.createElement("p");
        pElement.textContent = notice.title;
        todoListDiv.appendChild(pElement);
      });

      dateDiv.appendChild(spanElement);
      dateDiv.appendChild(todoListDiv);
      calDates.appendChild(dateDiv);

      //기본값으로 오늘 날짜 선택됨
      if (
        createDate.getFullYear() === today.getFullYear() &&
        createDate.getMonth() === today.getMonth() &&
        createDate.getDate() === today.getDate()
      ) {
        dateDiv.classList.add("selected-date");
        displayNoticesForDate(todayStr);
      }

      //날짜 클릭
      dateDiv.addEventListener("click", () => {
        const prevSelectedDate = localStorage.getItem("selectedDate");
        const newSelectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;

        if (prevSelectedDate === newSelectedDate) {
          //console.log("같은 날짜 클릭");
          return;
        }

        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
        });
        dateDiv.classList.add("selected-date");

        calHeader.textContent = `${createDate.getFullYear()}년 ${createDate.getMonth() + 1}월 ${createDate.getDate()}일`;

        const selectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);

        displayNoticesForDate(newSelectedDate);

        //체크리스트 공지 초기화
        // const checkListHeader = document.querySelector(".check-list-header");
        // checkListHeader.querySelectorAll(".items").forEach((item) => item.remove());

        //getClubs();
      });
    }
    // if (dateStr === todayStr) {
    //   displayNoticesForDate(todayStr);
    // }
  }
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
});
