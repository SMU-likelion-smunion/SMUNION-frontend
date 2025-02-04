document.addEventListener("DOMContentLoaded", () => {
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

    calHeader.textContent = `${year}년 ${month + 1}월 ${today.getDate()}일`; //년 월 일

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

      dateDiv.addEventListener("click", () => {
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
        });
        dateDiv.classList.add("selected-date");
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
  }

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

  renderCalendar();
});
