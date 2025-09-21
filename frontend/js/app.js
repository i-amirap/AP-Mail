"use strict";

import {
  getContacts,
  getContactById,
  readStatus,
  starredStatus,
  repliedStatus,
  setDelete,
  unsetDelete,
  hardDelete,
  sendEmail,
} from "./apis.js";

// Basic
const $ = document;
const $s = (elem) => {
  return $.querySelector(elem);
};
const $sa = (elems) => {
  return $.querySelectorAll(elems);
};
$s("html").scrollBy($s("html").scrollWidth, 0);

// Flags
let isMobile = false;
let indexHistory = 30;
let currentPage = 1;
let paginationMax = 1;
let manualCurrent = false;
let contacts = [];
let selectedItems = [];
let searchDatas = [];
let allRows = [];
let allContacts = [];
let selectedAll = false;
let menuOpenned = false;
let isMultiSelect = false;
let mobileToolsOpen = false;
let mTools = 1; // 1 - 2
let routeNames = ["inbox", "send", "bookmark", "trash"];
let route = "inbox";

let appSettings = {
  itemsPerPage: 30, // تعداد آیتم در هر صفحه
  themeColor: "#2266cc", // رنگ اصلی برنامه (متغیر --theme-color)
  fontFamily: "Vazir", // فونت برنامه
  fontSize: "large", // اندازه فونت برنامه (مثلاً medium, large, x-large)
  language: "fa-IR", // زبان برنامه (فعلاً فقط فارسی)
  isDarkMode: false, // <<< وضعیت تم تاریک/روشن
  usePin: false, // وضعیت ورود با رمز عبور
};

// تلاش برای خواندن تنظیمات از localStorage
const storedSettings = localStorage.getItem("appSettings");
if (storedSettings) {
  try {
    const parsedSettings = JSON.parse(storedSettings);
    // ترکیب تنظیمات ذخیره شده با مقادیر پیش‌فرض (برای اطمینان از وجود همه کلیدها)
    appSettings = { ...appSettings, ...parsedSettings };
  } catch (e) {
    console.error("Error parsing appSettings from localStorage", e);
    localStorage.removeItem("appSettings"); // اگر مشکل داشت، پاک کن
  }
}

indexHistory = appSettings.itemsPerPage;

const routeFilters = {
  inbox: {
    hasReplied: false,
    isStarred: false,
    isDeleted: false,
  },
  send: {
    hasReplied: true,
    isDeleted: false,
  },
  bookmark: {
    isStarred: true,
    isDeleted: false,
  },
  trash: {
    isDeleted: true,
  },
};

const routeButtons = {
  inbox: (val) => `
    <button class="details" onclick="itemButtons('details' , ${
      val.id
    })">نمایش جزئیات</button>
    ${checkSeen(val)}
    <button class="star" onclick="itemButtons('star' , ${
      val.id
    })">ستاره دار</button>
    <button class="reply" onclick="itemButtons('reply' , ${
      val.id
    })">پاسخ دادن</button>
    <button class="delete" onclick="itemButtons('delete' , ${
      val.id
    })">حذف</button>
  `,
  send: (val) => `
    <button class="details" onclick="itemButtons('details' , ${val.id})">نمایش جزئیات</button>
    <button class="delete" onclick="itemButtons('delete' , ${val.id})">حذف</button>
  `,
  bookmark: (val) => `
    <button class="details" onclick="itemButtons('details' , ${val.id})">نمایش جزئیات</button>
    <button class="star" onclick="itemButtons('unStar' , ${val.id})">حذف از ستاره دار</button>
    <button class="reply" onclick="itemButtons('reply' , ${val.id})">پاسخ دادن</button>
    <button class="delete" onclick="itemButtons('delete' , ${val.id})">حذف</button>
  `,
  trash: (val) => `
    <button class="details" onclick="itemButtons('details' , ${val.id})">نمایش جزئیات</button>
    <button class="reply" onclick="itemButtons('restore' , ${val.id})">بازیابی</button>
    <button class="delete" onclick="itemButtons('delete' , ${val.id})">حذف</button>
  `,
};

const pcToolsBtns = `
  <button title="فیلتر کردن" class="btn notMultiOption" onclick="openFilterPopup()">
    <i class="bi bi-funnel-fill"></i>
    فیلتر
  </button>

  <button class="btn multiOpBtn" title="حالت انتخاب چندتایی" onclick="multipleSelect()">
    <i class="bi bi-check2-square"></i>
    <span style="color: white">حالت انتخاب</span>
  </button>

  <button title="تازه سازی" class="btn reloadDatas notMultiOption" onclick="loadDatas()">
    <i class="bi bi-arrow-clockwise"></i>
    تازه سازی
  </button>

  <button
    title="چاپ"
    onclick="print()"
    class="btn pcTools notMultiOption"
  >
    <i class="bi bi-printer-fill"></i>
    چاپ
  </button>

  <button
    title="ذخیره"
    onclick="savePage()"
    class="btn pcTools notMultiOption"
  >
    <i class="bi bi-floppy-fill"></i>
    ذخیره صفحه
  </button>

  <button
    title="اشتراک گذاری"
    onclick="sharePage()"
    class="btn pcTools notMultiOption"
  >
    <i class="bi bi-share-fill"></i>
    اشتراک گذاری
  </button>
`;

const mobileToolsBtns = `
  <div class="mTools">
          <button class="btn" style="gap: 0" onclick="openMobileTools()">
            <i
              style="font-size: x-large; color: white; margin-right: -0.5rem"
              class="bi bi-three-dots-vertical"
            ></i>
            منوی ابزار
          </button>

          <div class="card mobileMenu" dir="rtl">
            <ul class="list">
              <li class="element" onclick="openFilterPopup(); $s('.toolsClose').click()">
                <svg
                  fill="#000000"
                  width="800px"
                  height="800px"
                  viewBox="0 0 24 24"
                  id="filter"
                  data-name="Flat Color"
                  xmlns="http://www.w3.org/2000/svg"
                  class="icon flat-color"
                >
                  <path
                    id="primary"
                    d="M18,2H6A2,2,0,0,0,4,4V6.64a2,2,0,0,0,.46,1.28L9,13.36V21a1,1,0,0,0,.47.85A1,1,0,0,0,10,22a1,1,0,0,0,.45-.11l4-2A1,1,0,0,0,15,19V13.36l4.54-5.44A2,2,0,0,0,20,6.64V4A2,2,0,0,0,18,2Z"
                    style="fill: #ffffff"
                  ></path>
                </svg>
                <p class="label">فیلتر</p>
              </li>

              <div class="separator"></div>

              <li class="element" onclick="loadDatas(); $s('.toolsClose').click()">
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.793 2.293a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L14.086 7H12.5C8.952 7 6 9.952 6 13.5S8.952 20 12.5 20s6.5-2.952 6.5-6.5a1 1 0 1 1 2 0c0 4.652-3.848 8.5-8.5 8.5S4 18.152 4 13.5 7.848 5 12.5 5h1.586l-1.293-1.293a1 1 0 0 1 0-1.414z"
                    fill="#ffffff"
                  />
                </svg>
                <p class="label">تازه سازی</p>
              </li>

              <div class="separator"></div>

              <li class="element" onclick="multipleSelect()">
                <svg
                  fill="#ffffff"
                  width="800px"
                  height="800px"
                  viewBox="0 0 14 14"
                  role="img"
                  focusable="false"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m 4.2666667,5.73333 -0.9333334,0.93334 3,3 L 13,3 12.066667,2.06667 6.3333333,7.8 4.2666667,5.73333 Z m 7.4000003,5.93334 -9.3333337,0 0,-9.33334 L 9,2.33333 9,1 2.3333333,1 C 1.6,1 1,1.6 1,2.33333 l 0,9.33334 C 1,12.4 1.6,13 2.3333333,13 l 9.3333337,0 C 12.4,13 13,12.4 13,11.66667 l 0,-5.33334 -1.333333,0 0,5.33334 z"
                  />
                </svg>
                <p class="label">حالت انتخاب</p>
              </li>
            </ul>
          </div>

          <div class="card mobileMulti" dir="rtl">
            <ul class="list"></ul>
          </div>
        </div>
`;

const pcMultiSelectBtns = {
  inbox: `
    <button
      title="انتخاب همه"
      style="background-color: #26c"
      class="btn multiOption"
      onclick="selectAll()"
    >
      <i class="bi bi-check-square-fill"></i>
      انتخاب همه
    </button>

    <button
      title="علامت گذاری به عنوان خوانده شده"
      style="background-color: #1cb92e"
      class="btn multiOption disabled"
      onclick="async function setRead() {
        $s('.loading').style.display = 'flex';
        await readStatus(selectedItems, 1);
        loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
      } setRead();"
    >
      <i class="bi bi-check2-all"></i>
      افزودن به خوانده شده
    </button>

    <button
      title="حذف از خوانده شده"
      style="background-color: rgb(168 0 8)"
      class="btn multiOption disabled"
      onclick="async function unSetRead() {
        $s('.loading').style.display = 'flex';
        await readStatus(selectedItems, 0);
        loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
      } unSetRead();"
    >
      <i class="bi bi-check2-all"></i>
      حذف از خوانده شده
    </button>

    <button
      title="علامت گذاری به عنوان پیام ستاره دار"
      style="background-color: #cea70c"
      class="btn multiOption disabled"
      onclick="async function setStar() {
        $s('.loading').style.display = 'flex';
        await starredStatus(selectedItems, 1);
        loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
      } setStar();"
    >
      <i class="multiOption bi bi-bookmark-star-fill"></i>
      افزودن به ستاره دار
    </button>

    <button
      title="حذف"
      style="background-color: #e6121c"
      class="btn multiOption disabled"
      onclick="async function multiDelete() {
        let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

        if (confirmMsg) {
          $s('.loading').style.display = 'flex';
          await setDelete(selectedItems);
          loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
        }
      } multiDelete();"
    >
      <i class="multiOption bi bi-trash-fill"></i>
      حذف
    </button>
  `,
  send: `
    <button
      title="انتخاب همه"
      style="background-color: #26c"
      class="btn multiOption"
      onclick="selectAll()"
    >
      <i class="bi bi-check-square-fill"></i>
      انتخاب همه
    </button>

    <button
      title="حذف"
      style="background-color: #e6121c"
      class="btn multiOption disabled"
      onclick="async function multiDelete() {
        let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

        if (confirmMsg) {
          $s('.loading').style.display = 'flex';
          await setDelete(selectedItems);
          loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
        }
      } multiDelete();"
    >
      <i class="multiOption bi bi-trash-fill"></i>
      حذف
    </button>
  `,
  bookmark: `
    <button
      title="انتخاب همه"
      style="background-color: #26c"
      class="btn multiOption"
      onclick="selectAll()"
    >
      <i class="bi bi-check-square-fill"></i>
      انتخاب همه
    </button>

    <button
      title="علامت گذاری به عنوان خوانده شده"
      style="background-color: #1cb92e"
      class="btn multiOption disabled"
      onclick="async function setRead() {
        $s('.loading').style.display = 'flex';
        await readStatus(selectedItems, 1);
        loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
      } setRead();"
    >
      <i class="bi bi-check2-all"></i>
      افزودن به خوانده شده
    </button>

    <button
      title="حذف از خوانده شده"
      style="background-color: rgb(168 0 8)"
      class="btn multiOption disabled"
      onclick="async function unSetRead() {
        $s('.loading').style.display = 'flex';
        await readStatus(selectedItems, 0);
        loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
      } unSetRead();"
    >
      <i class="bi bi-check2-all"></i>
      حذف از خوانده شده
    </button>

    <button
      title="حذف از ستاره دار"
      style="background-color: #cea70c"
      class="btn multiOption disabled"
      onclick="async function unSetStar() {
        $s('.loading').style.display = 'flex';
        await starredStatus(selectedItems, 0);
        loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
      } unSetStar();"
    >
      <i class="multiOption bi bi-bookmark-star-fill"></i>
      حذف از ستاره دار
    </button>

    <button
      title="حذف"
      style="background-color: #e6121c"
      class="btn multiOption disabled"
      onclick="async function multiDelete() {
        let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

        if (confirmMsg) {
          $s('.loading').style.display = 'flex';
          await setDelete(selectedItems);
          loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
        }
      } multiDelete();"
    >
      <i class="multiOption bi bi-trash-fill"></i>
      حذف
    </button>
  `,
  trash: `
    <button
      title="انتخاب همه"
      style="background-color: #26c"
      class="btn multiOption"
      onclick="selectAll()"
    >
      <i class="bi bi-check-square-fill"></i>
      انتخاب همه
    </button>

    <button
      title="بازیابی"
      style="background-color: #26c"
      class="btn multiOption disabled"
      onclick="async function multiDelete() {
        $s('.loading').style.display = 'flex';
        await unsetDelete(selectedItems);
        loadDatas();
        selectAll(false);
        selectedAll = false;
        multipleSelect();
        selectedItems = [];

      } multiDelete();"
    >
      <i class="bi bi-arrow-repeat"></i>
      بازیابی
    </button>

    <button
      title="حذف"
      style="background-color: #e6121c"
      class="btn multiOption disabled"
      onclick="async function multiHardDelete() {
        let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

        if (confirmMsg) {
          $s('.loading').style.display = 'flex';
          await hardDelete(selectedItems);
          loadDatas();
          selectAll(false);
          selectedAll = false;
          multipleSelect();
          selectedItems = [];
        }
      } multiHardDelete();"
    >
      <i class="multiOption bi bi-trash-fill"></i>
      حذف
    </button>
  `,
};

const mobileMultiSelectBtns = {
  inbox: `
    <li class="element backMenu" onclick="multipleSelect(); $s('.toolsClose').click()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M3.4,29h33.2c0.9,0,1.3,1.1,0.7,1.7l-9.6,9.6c-0.6,0.6-0.6,1.5,0,2.1l2.2,2.2c0.6,0.6,1.5,0.6,2.1,0L49.5,27
                      c0.6-0.6,0.6-1.5,0-2.1L32,7.4c-0.6-0.6-1.5-0.6-2.1,0l-2.1,2.1c-0.6,0.6-0.6,1.5,0,2.1l9.6,9.6c0.6,0.7,0.2,1.8-0.7,1.8H3.5
                      C2.7,23,2,23.6,2,24.4v3C2,28.2,2.6,29,3.4,29z"
                  />
                </svg>
                <p class="label">بازگشت</p>
              </li>

              <div class="separator"></div>

              <li class="element" onclick="selectAll()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M44,2.5H19c-2.6,0-4.7,2.1-4.7,4.7V8c0,0.5,0.3,0.8,0.8,0.8h22.7c2.6,0,4.7,2.1,4.7,4.7v24.3
	c0,0.5,0.3,0.8,0.8,0.8H44c2.6,0,4.7-2.1,4.7-4.7V7.2C48.7,4.6,46.6,2.5,44,2.5z"
                  />
                  <path
                    d="M33,13.5H8c-2.6,0-4.7,2.1-4.7,4.7v26.6c0,2.6,2.1,4.7,4.7,4.7H33c2.6,0,4.7-2.1,4.7-4.7V18.2
	C37.8,15.6,35.6,13.5,33,13.5z M31,26.8l-12,12c-0.5,0.5-1,0.7-1.6,0.7c-0.5,0-1.2-0.2-1.6-0.7l-5.8-5.8c-0.5-0.5-0.5-1.2,0-1.6
	l1.6-1.6c0.5-0.5,1.2-0.5,1.6,0l4.2,4.2l10.3-10.3c0.5-0.5,1.2-0.5,1.6,0l1.6,1.6C31.4,25.6,31.4,26.4,31,26.8z"
                  />
                </svg>
                <p class="label">انتخاب همه</p>
              </li>

              <div class="separator"></div>

              <li
                class="element seen disabled"
                onclick="async function setRead() {
                  $s('.loading').style.display = 'flex';
                  await readStatus(selectedItems, 1);
                  loadDatas();
                    selectAll(false);
                    selectedAll = false;
                    multipleSelect();
                    selectedItems = [];
                } setRead(); $s('.toolsClose').click();"
              >
                <svg
                  fill="#ffffff"
                  width="800px"
                  height="800px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.305,11.235a1,1,0,0,1,1.414.024l3.206,3.319L14.3,7.289A1,1,0,0,1,15.7,8.711l-8.091,8a1,1,0,0,1-.7.289H6.9a1,1,0,0,1-.708-.3L2.281,12.649A1,1,0,0,1,2.305,11.235ZM20.3,7.289l-7.372,7.289-.263-.273a1,1,0,1,0-1.438,1.39l.966,1a1,1,0,0,0,.708.3h.011a1,1,0,0,0,.7-.289l8.091-8A1,1,0,0,0,20.3,7.289Z"
                  />
                </svg>
                <p class="label">افزودن به خوانده شده</p>
              </li>

              <div class="separator"></div>

              <li
                class="element delete disabled"
                onclick="async function unSetRead() {
                  $s('.loading').style.display = 'flex';
                  await readStatus(selectedItems, 0);
                  loadDatas();
                    selectAll(false);
                    selectedAll = false;
                    multipleSelect();
                    selectedItems = [];
                } unSetRead(); $s('.toolsClose').click();"
              >
                <svg
                  fill="#b72c1d"
                  width="800px"
                  height="800px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.305,11.235a1,1,0,0,1,1.414.024l3.206,3.319L14.3,7.289A1,1,0,0,1,15.7,8.711l-8.091,8a1,1,0,0,1-.7.289H6.9a1,1,0,0,1-.708-.3L2.281,12.649A1,1,0,0,1,2.305,11.235ZM20.3,7.289l-7.372,7.289-.263-.273a1,1,0,1,0-1.438,1.39l.966,1a1,1,0,0,0,.708.3h.011a1,1,0,0,0,.7-.289l8.091-8A1,1,0,0,0,20.3,7.289Z"
                  />
                </svg>
                <p class="label">حذف از خوانده شده</p>
              </li>

              <div class="separator"></div>

              <li
                class="element star disabled"
                onclick="async function setStar() {
                  $s('.loading').style.display = 'flex';
                  await starredStatus(selectedItems, 1);
                  loadDatas();
                    selectAll(false);
                    selectedAll = false;
                    multipleSelect();
                    selectedItems = [];
                } setStar(); $s('.toolsClose').click();"
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 17 17"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  class="si-glyph si-glyph-bookmark"
                >
                  <title>132</title>

                  <defs></defs>
                  <g
                    stroke="none"
                    stroke-width="1"
                    fill="none"
                    fill-rule="evenodd"
                  >
                    <path
                      d="M12.6770458,0 L3.3259431,0 C2.59354904,0 2.002,0.604724409 2.002,1.35256693 L2.002,14.6474331 C2.002,15.3952756 2.59455508,16 3.3259431,16 L8.00199745,11.9866457 L12.6760397,16 C13.4084338,16 14.0019949,15.3952756 14.0019949,14.6474331 L14.0019949,1.35256693 C14.004007,0.603716535 13.4094398,0 12.6770458,0 L12.6770458,0 Z M10.4815694,10 L8.01,8.63310123 L5.53843063,10 L6.01050543,7.10444563 L4.01,5.05516872 L6.77370988,4.63310123 L8.01,2 L9.24629012,4.63310123 L12.01,5.05516872 L10.0094946,7.10444563 L10.4815694,10 L10.4815694,10 Z"
                      fill="#ffffff"
                      class="si-glyph-fill"
                    ></path>
                  </g>
                </svg>
                <p class="label">افزودن به ستاره دار</p>
              </li>

              <div class="separator"></div>

              <li
                class="element delete disabled"
                onclick="async function multiDelete() {
                          let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

                          if (confirmMsg) {
                            $s('.loading').style.display = 'flex';
                            await setDelete(selectedItems);
                            loadDatas();
                            selectAll(false);
                            selectedAll = false;
                            multipleSelect();
                            selectedItems = [];
                          }
                        } multiDelete(); $s('.toolsClose').click();"
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#ffffff"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"
                  />
                </svg>
                <p class="label">حذف</p>
              </li>
  `,
  send: `
    <li class="element backMenu" onclick="multipleSelect(); $s('.toolsClose').click()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M3.4,29h33.2c0.9,0,1.3,1.1,0.7,1.7l-9.6,9.6c-0.6,0.6-0.6,1.5,0,2.1l2.2,2.2c0.6,0.6,1.5,0.6,2.1,0L49.5,27
                      c0.6-0.6,0.6-1.5,0-2.1L32,7.4c-0.6-0.6-1.5-0.6-2.1,0l-2.1,2.1c-0.6,0.6-0.6,1.5,0,2.1l9.6,9.6c0.6,0.7,0.2,1.8-0.7,1.8H3.5
                      C2.7,23,2,23.6,2,24.4v3C2,28.2,2.6,29,3.4,29z"
                  />
                </svg>
                <p class="label">بازگشت</p>
              </li>

              <div class="separator"></div>

              <li class="element" onclick="selectAll()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M44,2.5H19c-2.6,0-4.7,2.1-4.7,4.7V8c0,0.5,0.3,0.8,0.8,0.8h22.7c2.6,0,4.7,2.1,4.7,4.7v24.3
	c0,0.5,0.3,0.8,0.8,0.8H44c2.6,0,4.7-2.1,4.7-4.7V7.2C48.7,4.6,46.6,2.5,44,2.5z"
                  />
                  <path
                    d="M33,13.5H8c-2.6,0-4.7,2.1-4.7,4.7v26.6c0,2.6,2.1,4.7,4.7,4.7H33c2.6,0,4.7-2.1,4.7-4.7V18.2
	C37.8,15.6,35.6,13.5,33,13.5z M31,26.8l-12,12c-0.5,0.5-1,0.7-1.6,0.7c-0.5,0-1.2-0.2-1.6-0.7l-5.8-5.8c-0.5-0.5-0.5-1.2,0-1.6
	l1.6-1.6c0.5-0.5,1.2-0.5,1.6,0l4.2,4.2l10.3-10.3c0.5-0.5,1.2-0.5,1.6,0l1.6,1.6C31.4,25.6,31.4,26.4,31,26.8z"
                  />
                </svg>
                <p class="label">انتخاب همه</p>
              </li>

              <div class="separator"></div>

              <li
                class="element delete disabled"
                onclick="async function multiDelete() {
                          let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

                          if (confirmMsg) {
                            $s('.loading').style.display = 'flex';
                            await setDelete(selectedItems);
                            loadDatas();
                            selectAll(false);
                            selectedAll = false;
                            multipleSelect();
                            selectedItems = [];
                          }
                        } multiDelete(); $s('.toolsClose').click();"
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#ffffff"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"
                  />
                </svg>
                <p class="label">حذف</p>
              </li>
  `,
  bookmark: `
    <li class="element backMenu" onclick="multipleSelect(); $s('.toolsClose').click()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M3.4,29h33.2c0.9,0,1.3,1.1,0.7,1.7l-9.6,9.6c-0.6,0.6-0.6,1.5,0,2.1l2.2,2.2c0.6,0.6,1.5,0.6,2.1,0L49.5,27
                      c0.6-0.6,0.6-1.5,0-2.1L32,7.4c-0.6-0.6-1.5-0.6-2.1,0l-2.1,2.1c-0.6,0.6-0.6,1.5,0,2.1l9.6,9.6c0.6,0.7,0.2,1.8-0.7,1.8H3.5
                      C2.7,23,2,23.6,2,24.4v3C2,28.2,2.6,29,3.4,29z"
                  />
                </svg>
                <p class="label">بازگشت</p>
              </li>

              <div class="separator"></div>

              <li class="element" onclick="selectAll()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M44,2.5H19c-2.6,0-4.7,2.1-4.7,4.7V8c0,0.5,0.3,0.8,0.8,0.8h22.7c2.6,0,4.7,2.1,4.7,4.7v24.3
	c0,0.5,0.3,0.8,0.8,0.8H44c2.6,0,4.7-2.1,4.7-4.7V7.2C48.7,4.6,46.6,2.5,44,2.5z"
                  />
                  <path
                    d="M33,13.5H8c-2.6,0-4.7,2.1-4.7,4.7v26.6c0,2.6,2.1,4.7,4.7,4.7H33c2.6,0,4.7-2.1,4.7-4.7V18.2
	C37.8,15.6,35.6,13.5,33,13.5z M31,26.8l-12,12c-0.5,0.5-1,0.7-1.6,0.7c-0.5,0-1.2-0.2-1.6-0.7l-5.8-5.8c-0.5-0.5-0.5-1.2,0-1.6
	l1.6-1.6c0.5-0.5,1.2-0.5,1.6,0l4.2,4.2l10.3-10.3c0.5-0.5,1.2-0.5,1.6,0l1.6,1.6C31.4,25.6,31.4,26.4,31,26.8z"
                  />
                </svg>
                <p class="label">انتخاب همه</p>
              </li>

              <div class="separator"></div>

              <li
                class="element seen disabled"
                onclick="async function setRead() {
                  $s('.loading').style.display = 'flex';
                  await readStatus(selectedItems, 1);
                  loadDatas();
                    selectAll(false);
                    selectedAll = false;
                    multipleSelect();
                    selectedItems = [];
                } setRead(); $s('.toolsClose').click();"
              >
                <svg
                  fill="#ffffff"
                  width="800px"
                  height="800px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.305,11.235a1,1,0,0,1,1.414.024l3.206,3.319L14.3,7.289A1,1,0,0,1,15.7,8.711l-8.091,8a1,1,0,0,1-.7.289H6.9a1,1,0,0,1-.708-.3L2.281,12.649A1,1,0,0,1,2.305,11.235ZM20.3,7.289l-7.372,7.289-.263-.273a1,1,0,1,0-1.438,1.39l.966,1a1,1,0,0,0,.708.3h.011a1,1,0,0,0,.7-.289l8.091-8A1,1,0,0,0,20.3,7.289Z"
                  />
                </svg>
                <p class="label">افزودن به خوانده شده</p>
              </li>

              <div class="separator"></div>

              <li
                class="element delete disabled"
                onclick="async function unSetRead() {
                  $s('.loading').style.display = 'flex';
                  await readStatus(selectedItems, 0);
                  loadDatas();
                    selectAll(false);
                    selectedAll = false;
                    multipleSelect();
                    selectedItems = [];
                } unSetRead(); $s('.toolsClose').click();"
              >
                <svg
                  fill="#b72c1d"
                  width="800px"
                  height="800px"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.305,11.235a1,1,0,0,1,1.414.024l3.206,3.319L14.3,7.289A1,1,0,0,1,15.7,8.711l-8.091,8a1,1,0,0,1-.7.289H6.9a1,1,0,0,1-.708-.3L2.281,12.649A1,1,0,0,1,2.305,11.235ZM20.3,7.289l-7.372,7.289-.263-.273a1,1,0,1,0-1.438,1.39l.966,1a1,1,0,0,0,.708.3h.011a1,1,0,0,0,.7-.289l8.091-8A1,1,0,0,0,20.3,7.289Z"
                  />
                </svg>
                <p class="label">حذف از خوانده شده</p>
              </li>

              <div class="separator"></div>

              <li
                class="element star disabled"
                onclick="async function unSetStar() {
                  $s('.loading').style.display = 'flex';
                  await starredStatus(selectedItems, 0);
                  loadDatas();
                    selectAll(false);
                    selectedAll = false;
                    multipleSelect();
                    selectedItems = [];
                } unSetStar(); $s('.toolsClose').click();"
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 17 17"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  class="si-glyph si-glyph-bookmark"
                >
                  <title>132</title>

                  <defs></defs>
                  <g
                    stroke="none"
                    stroke-width="1"
                    fill="none"
                    fill-rule="evenodd"
                  >
                    <path
                      d="M12.6770458,0 L3.3259431,0 C2.59354904,0 2.002,0.604724409 2.002,1.35256693 L2.002,14.6474331 C2.002,15.3952756 2.59455508,16 3.3259431,16 L8.00199745,11.9866457 L12.6760397,16 C13.4084338,16 14.0019949,15.3952756 14.0019949,14.6474331 L14.0019949,1.35256693 C14.004007,0.603716535 13.4094398,0 12.6770458,0 L12.6770458,0 Z M10.4815694,10 L8.01,8.63310123 L5.53843063,10 L6.01050543,7.10444563 L4.01,5.05516872 L6.77370988,4.63310123 L8.01,2 L9.24629012,4.63310123 L12.01,5.05516872 L10.0094946,7.10444563 L10.4815694,10 L10.4815694,10 Z"
                      fill="#ffffff"
                      class="si-glyph-fill"
                    ></path>
                  </g>
                </svg>
                <p class="label">حذف از ستاره دار</p>
              </li>

              <div class="separator"></div>

              <li
                class="element delete disabled"
                onclick="async function multiDelete() {
                          let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

                          if (confirmMsg) {
                            $s('.loading').style.display = 'flex';
                            await setDelete(selectedItems);
                            loadDatas();
                            selectAll(false);
                            selectedAll = false;
                            multipleSelect();
                            selectedItems = [];
                          }
                        } multiDelete(); $s('.toolsClose').click();"
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#ffffff"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"
                  />
                </svg>
                <p class="label">حذف</p>
              </li>
  `,
  trash: `
    <li class="element backMenu" onclick="multipleSelect(); $s('.toolsClose').click()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M3.4,29h33.2c0.9,0,1.3,1.1,0.7,1.7l-9.6,9.6c-0.6,0.6-0.6,1.5,0,2.1l2.2,2.2c0.6,0.6,1.5,0.6,2.1,0L49.5,27
                      c0.6-0.6,0.6-1.5,0-2.1L32,7.4c-0.6-0.6-1.5-0.6-2.1,0l-2.1,2.1c-0.6,0.6-0.6,1.5,0,2.1l9.6,9.6c0.6,0.7,0.2,1.8-0.7,1.8H3.5
                      C2.7,23,2,23.6,2,24.4v3C2,28.2,2.6,29,3.4,29z"
                  />
                </svg>
                <p class="label">بازگشت</p>
              </li>

              <div class="separator"></div>

              <li class="element" onclick="selectAll()">
                <svg
                  fill="#ffffff"
                  xmlns="http://www.w3.org/2000/svg"
                  width="800px"
                  height="800px"
                  viewBox="0 0 52 52"
                  enable-background="new 0 0 52 52"
                  xml:space="preserve"
                >
                  <path
                    d="M44,2.5H19c-2.6,0-4.7,2.1-4.7,4.7V8c0,0.5,0.3,0.8,0.8,0.8h22.7c2.6,0,4.7,2.1,4.7,4.7v24.3
	c0,0.5,0.3,0.8,0.8,0.8H44c2.6,0,4.7-2.1,4.7-4.7V7.2C48.7,4.6,46.6,2.5,44,2.5z"
                  />
                  <path
                    d="M33,13.5H8c-2.6,0-4.7,2.1-4.7,4.7v26.6c0,2.6,2.1,4.7,4.7,4.7H33c2.6,0,4.7-2.1,4.7-4.7V18.2
	C37.8,15.6,35.6,13.5,33,13.5z M31,26.8l-12,12c-0.5,0.5-1,0.7-1.6,0.7c-0.5,0-1.2-0.2-1.6-0.7l-5.8-5.8c-0.5-0.5-0.5-1.2,0-1.6
	l1.6-1.6c0.5-0.5,1.2-0.5,1.6,0l4.2,4.2l10.3-10.3c0.5-0.5,1.2-0.5,1.6,0l1.6,1.6C31.4,25.6,31.4,26.4,31,26.8z"
                  />
                </svg>
                <p class="label">انتخاب همه</p>
              </li>

              <div class="separator"></div>

              <li
                class="element star disabled"
                onclick="async function multiDelete() {
                  $s('.loading').style.display = 'flex';
                  await unsetDelete(selectedItems);
                  loadDatas();
                  selectAll(false);
                  selectedAll = false;
                  multipleSelect();
                  selectedItems = [];

                } multiDelete(); $s('.toolsClose').click();"
              >
                <svg width="800px" height="800px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#ffffff" d="M19.295346,12 C19.683732,11.997321 20,12.315434 20,12.7087815 L20,15.9132194 C20,16.3046684 19.6866632,16.6220005 19.3001428,16.6220005 C18.9136223,16.6220005 18.6002855,16.3046684 18.6002855,15.9132194 L18.6006646,14.7880072 C16.7783174,17.8441657 13.3981233,20 9.75558622,20 C5.34669464,20 1.65005079,17.2790232 0.0473577091,13.0847914 C-0.0921406706,12.7197255 0.0869918429,12.3092534 0.447461376,12.1679763 C0.80793091,12.0266992 1.21323498,12.2081158 1.35273336,12.5731817 C2.75210409,16.2353209 5.94083219,18.5824378 9.75558622,18.5824378 C13.1270432,18.5824378 16.2763668,16.4010153 17.7430824,13.4292559 L16.2715084,13.4386023 C15.884997,13.4412853 15.56952,13.1261356 15.566854,12.7346958 C15.5642216,12.343256 15.8754035,12.0237564 16.2619149,12.0210734 L19.295346,12 Z M10.2444138,0 C14.6533054,0 18.3499492,2.72097676 19.9526423,6.9152086 C20.0921407,7.28027447 19.9130082,7.69074656 19.5525386,7.83202368 C19.1920691,7.9733008 18.786765,7.79188418 18.6472666,7.4268183 C17.2478959,3.76467906 14.0591678,1.4175622 10.2444138,1.4175622 C6.87295684,1.4175622 3.72363319,3.59898468 2.25691759,6.57074409 L3.72849164,6.56139765 C4.11500304,6.5587147 4.43048002,6.87386439 4.43314598,7.26530419 C4.43577836,7.65674399 4.12459654,7.97624361 3.73808514,7.97892656 L0.704653993,8 C0.316268039,8.00267895 4.36983782e-13,7.68456603 4.36983782e-13,7.29121854 L4.36983782e-13,4.0867806 C4.36983782e-13,3.69533161 0.31333676,3.3779995 0.699857241,3.3779995 C1.08637772,3.3779995 1.39971448,3.69533161 1.39971448,4.0867806 L1.39933538,5.21199282 C3.22168264,2.1558343 6.60187665,0 10.2444138,0 Z"/>
                </svg>
                <p class="label">بازیابی</p>
              </li>

              <div class="separator"></div>

              <li
                class="element delete disabled"
                onclick="async function multiDelete() {
                          let confirmMsg = await swConfirm('حذف آیتم!' , 'از حذف آیتم ها اطمینان دارید؟');

                          if (confirmMsg) {
                            $s('.loading').style.display = 'flex';
                            await setDelete(selectedItems);
                            loadDatas();
                            selectAll(false);
                            selectedAll = false;
                            multipleSelect();
                            selectedItems = [];
                          }
                        } multiDelete(); $s('.toolsClose').click();"
              >
                <svg
                  width="800px"
                  height="800px"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#ffffff"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"
                  />
                </svg>
                <p class="label">حذف</p>
              </li>
  `,
};

$sa(".menuBtn").forEach((elem) => {
  elem.addEventListener("click", routeFunc);
});
$sa(".disabled").forEach((elem) => {
  elem.setAttribute("disabled", "");
  elem.style.pointerEvents = "none";
});

// Functions
function applySettingsToCss() {
  $.documentElement.style.setProperty("--theme-color", appSettings.themeColor);
  $.documentElement.style.setProperty("--font-family", appSettings.fontFamily);
  $.documentElement.style.setProperty("--font-size", appSettings.fontSize);

  const themeSwitchCheckbox = $s("#themeChanger");

  if (appSettings.isDarkMode) {
    $.documentElement.style.colorScheme = "dark";
    $.documentElement.style.setProperty("--bg-color", "#1c1c1c");
    $.documentElement.style.setProperty("--text-color", "white");
    $s("main").style.backgroundColor = "#242424";
    themeSwitchCheckbox.checked = true;
  } else {
    $.documentElement.style.colorScheme = "light";
    $.documentElement.style.setProperty("--bg-color", "white");
    $.documentElement.style.setProperty("--text-color", "#1c1c1c");
    $s("main").style.backgroundColor = "#ebebeb";
    themeSwitchCheckbox.checked = false;
  }
}

function themeControl() {
  appSettings.isDarkMode = !appSettings.isDarkMode;
  localStorage.setItem("appSettings", JSON.stringify(appSettings));
  applySettingsToCss();
}

function menuFunc(event) {
  event.target.checked ? (menuOpenned = true) : (menuOpenned = false);
  if (menuOpenned) {
    window.scrollTo({ top: 0 });
    $s(".spaceClose").style.setProperty("visibility", "visible");
    $s(".spaceClose").style.setProperty(
      "-webkit-backdrop-filter",
      "blur(10px)"
    );
    $s(".spaceClose").style.setProperty("backdrop-filter", "blur(10px)");
  } else {
    $s(".spaceClose").style.setProperty("visibility", "hidden");
    $s(".spaceClose").style.setProperty("-webkit-backdrop-filter", "blur(0px)");
    $s(".spaceClose").style.setProperty("backdrop-filter", "blur(0px)");
  }
}

async function routeFunc(event) {
  let elemClass;
  if (!event.target.className.includes("settings")) {
    $s(".active").classList.remove("active");

    if (event.target.localName === "i") {
      event.target.parentElement.classList.add("active");
      elemClass = event.target.parentElement.classList;
    } else if (event.target.localName === "span") {
      event.target.classList.add("active");
      elemClass = event.target.classList;
    }

    routeNames.forEach((val) => {
      elemClass.forEach((item) => {
        item === val ? (route = val) : null;
      });
    });

    location.hash = "#" + route;
    $s(".spaceClose").click();
    loadDatas();
  }

  route === "inbox"
    ? ($s(".minAppName").innerText = "(پیام های دریافتی)")
    : null;
  route === "send" ? ($s(".minAppName").innerText = "(پیام های ارسالی)") : null;
  route === "bookmark"
    ? ($s(".minAppName").innerText = "(پیام های ستاره دار)")
    : null;
  route === "trash"
    ? ($s(".minAppName").innerText = "(پیام های حذف شده)")
    : null;

  if (isMultiSelect) {
    multipleSelect();
  }
  $s(".toolsClose").click();
}

// async function loadDatas() {
//   $s('.loading').style.display = 'flex';
//   $s("table > tbody").innerHTML = "";
//   if ($s(".table-wrapper > center")) {
//     $s(".table-wrapper > center").remove();
//   }
//   currentPage === "" ? (currentPage = 1) : null;
//   contacts = [];

//   // ✅ استفاده از routeFilters برای دریافت فیلترهای مناسب
//   const currentFilters = routeFilters[route];
//   if (!currentFilters) {
//     await swConfirm(
//       "خطایی در برنامه رخ داده، برنامه دوباره راه اندازی میشود",
//       "",
//       false,
//       "تایید"
//     );
//     location.reload();
//     return;
//   }

//   let res = await getContacts({
//     ...currentFilters,
//     page: currentPage,
//     limit: indexHistory,
//   });

//   paginationMax = await res.meta.pages;
//   $s("#pagesNumInp").value = await res.meta.pages;
//   contacts.push(...res.data);

//   if (contacts.length > 0) {
//     $s("#currentPagesNumInp").value = currentPage;
//     $s(".table-wrapper").style.setProperty("flex-wrap", "wrap");

//     const getButtonsHtml = routeButtons[route];

//     contacts.forEach((val, index) => {
//       $s("table > tbody").insertAdjacentHTML(
//         "beforeend",
//         `<tr>
//           <td class="emkanat">
//             <input class="userId" type="hidden" value="${val.id}">
//             <input style="display: var(--multiInp)" type="checkbox" onchange="itemCheckInp(event ,${
//               val.id
//             })">
//             ${getButtonsHtml(val)}
//           </td>
//           <td>
//             <span class="mozo">${val.subject}</span>
//           </td>
//           <td>
//             <span class="nam">${checkLength(val.name)}</span>
//           </td>
//           <td>
//             <span class="radifNum">${
//               (currentPage - 1) * indexHistory + (index + 1)
//             }</span>
//           </td>
//         </tr>`
//       );
//     });
//   } else {
//     currentPage = 1;
//     paginationMax = 1;
//     $s("#currentPagesNumInp").value = 1;
//     $s("#pagesNumInp").value = 1;
//     $s(".table-wrapper").style.setProperty("flex-wrap", "nowrap");

//     $s(".table-wrapper").insertAdjacentHTML(
//       "beforeend",
//       `
//         <center style="
//           width: 100%;
//           height: 100%;
//           /* padding: 2rem 1rem; */
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           border: 3px solid;
//           border-top: none;">
//             <h2 style="font-size: x-large; direction: rtl">داده ای برای نمایش یافت نشد !</h2>
//         </center>
//       `
//     );
//   }

//   allRows = Array.from($sa("table > tbody > tr"));
//   $s(".table-wrapper").scrollBy($s(".table-wrapper").scrollWidth, 0);
//   $s(".loading").style.display = "none";
// }

async function loadDatas() {
  $s(".loading").style.display = "flex";
  $s("table > tbody").innerHTML = "";
  if ($s(".table-wrapper > center")) {
    $s(".table-wrapper > center").remove();
  }
  currentPage === "" ? (currentPage = 1) : null;
  allContacts = []; // پاک کردن مخاطبین قبلی
  allRows = []; // پاک کردن ردیف های قبلی

  // ✅ استفاده از routeFilters برای دریافت فیلترهای مناسب
  const currentFilters = routeFilters[route];
  if (!currentFilters) {
    await swConfirm(
      "خطایی در برنامه رخ داده، برنامه دوباره راه اندازی میشود",
      "",
      false,
      "تایید"
    );
    location.reload();
    return;
  }

  let res = await getContacts({
    ...currentFilters,
    page: currentPage,
    limit: indexHistory,
  });

  paginationMax = await res.meta.pages;
  $s("#pagesNumInp").value = await res.meta.pages;
  allContacts = res.data.map((contact) => ({
    ...contact,
    createdAt: contact.created_at ? new Date(contact.created_at) : null, // استفاده از created_at به جای createdAt و تبدیل به Date
  }));

  if (allContacts.length > 0) {
    $s("#currentPagesNumInp").value = currentPage;
    $s(".table-wrapper").style.setProperty("flex-wrap", "wrap");

    const getButtonsHtml = routeButtons[route];

    allContacts.forEach((val, index) => {
      $s("table > tbody").insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td class="emkanat">
            <input class="userId" type="hidden" value="${val.id}">
            <input style="display: var(--multiInp)" type="checkbox" onchange="itemCheckInp(event ,${
              val.id
            })">
            ${getButtonsHtml(val)}
          </td>
          <td>
            <span class="mozo">${val.subject}</span>
          </td>
          <td>
            <span class="nam">${checkLength(val.name)}</span>
          </td>
          <td>
            <span class="radifNum">${
              (currentPage - 1) * indexHistory + (index + 1)
            }</span>
          </td>
        </tr>`
      );
    });

    // بعد از اضافه کردن ردیف ها به جدول، همه ردیف ها رو ذخیره کن
    allRows = Array.from($sa("table > tbody > tr"));
  } else {
    currentPage = 1;
    paginationMax = 1;
    $s("#currentPagesNumInp").value = 1;
    $s("#pagesNumInp").value = 1;
    $s(".table-wrapper").style.setProperty("flex-wrap", "nowrap");

    $s(".table-wrapper").insertAdjacentHTML(
      "beforeend",
      `
        <center style="
          width: 100%;
          height: 100%;
          /* padding: 2rem 1rem; */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px solid;
          border-top: none;">
            <h2 style="font-size: x-large; direction: rtl">داده ای برای نمایش یافت نشد !</h2>
        </center>
      `
    );
  }

  $s(".table-wrapper").scrollBy($s(".table-wrapper").scrollWidth, 0);
  $s(".loading").style.display = "none";
  $s(".toolsClose").click();
}

function dataURLtoBlob(dataURL) {
  const [header, base64] = dataURL.split(";base64,");
  const mime = header.split(":")[1];
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

async function savePage() {
  try {
    const node = document.getElementById("captureArea"); // عنصر هدف
    const canvas = await html2canvas(node, {
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const dataUrl = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "screenshot.png";
    a.click();
  } catch (e) {
    console.error("❌ خطا در savePage:", e);
    swAlert("error", "خطا!", "خطایی در ذخیره‌سازی تصویر رخ داد.");
  }
}

async function sharePage() {
  try {
    const node = document.getElementById("captureArea");
    const canvas = await html2canvas(node, {
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const dataUrl = canvas.toDataURL("image/png");

    const blob = dataURLtoBlob(dataUrl);
    const file = new File([blob], "screenshot.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: document.title,
        text: "یک اسکرین‌شات از صفحه",
        files: [file],
        // url: window.location.href   // اگر می‌خواهید URL هم بفرستید
      });
      console.log("✅ تصویر با موفقیت به‌اشتراک‌گذاری شد");
    } else {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "screenshot.png";
      a.click();
      swAlert(
        "error",
        "خطا!",
        "مرورگر شما Web Share را پشتیبانی نمی‌کند؛ تصویر به‌صورت دانلود ذخیره شد."
      );
    }
  } catch (e) {
    console.error("❌ خطا در sharePage:", e);
    alert("خطایی در فرآیند اشتراک‌گذاری رخ داد.");
  }
}

function multipleSelect() {
  if (!isMobile) {
    if (!isMultiSelect) {
      $.documentElement.style.setProperty("--multiOption", "flex");
      $.documentElement.style.setProperty("--notMultiOption", "none");
      $.documentElement.style.setProperty("--multiInp", "block");
      $.documentElement.style.setProperty("--multiItemBtns", "none");

      $s(".tools").innerHTML = "";

      if (route === "inbox") {
        $s(".tools").insertAdjacentHTML("beforeend", pcToolsBtns);
        $s(".tools").insertAdjacentHTML("beforeend", pcMultiSelectBtns.inbox);
      } else if (route === "send") {
        $s(".tools").insertAdjacentHTML("beforeend", pcToolsBtns);
        $s(".tools").insertAdjacentHTML("beforeend", pcMultiSelectBtns.send);
      } else if (route === "bookmark") {
        $s(".tools").insertAdjacentHTML("beforeend", pcToolsBtns);
        $s(".tools").insertAdjacentHTML(
          "beforeend",
          pcMultiSelectBtns.bookmark
        );
      } else if (route === "trash") {
        $s(".tools").insertAdjacentHTML("beforeend", pcToolsBtns);
        $s(".tools").insertAdjacentHTML("beforeend", pcMultiSelectBtns.trash);
      }

      $s(".multiOpBtn > span").innerText = "لغو حالت انتخاب";
      $s(".multiOpBtn").style.backgroundColor = "rgb(230, 18, 28)";

      $sa(".disabled").forEach((elem) => {
        elem.style.pointerEvents = "none";
        elem.setAttribute("disabled", "");
        elem.classList.add("disabled");
        elem.classList.remove("enabled");
      });
      isMultiSelect = true;
    } else {
      $.documentElement.style.setProperty("--multiOption", "none");
      $.documentElement.style.setProperty("--notMultiOption", "flex");
      $.documentElement.style.setProperty("--multiInp", "none");
      $.documentElement.style.setProperty("--multiItemBtns", "inline-block");

      $s(".multiOpBtn > span").innerText = "حالت انتخاب";
      $s(".multiOpBtn").style.backgroundColor = "var(--theme-color)";

      if (navigator.userAgentData?.mobile) {
        $sa(".pcTools").forEach((elem) => (elem.style.display = "none"));
      }

      selectedItems = [];
      self.selectedItems = selectedItems;
      $sa(".emkanat > input[type='checkbox']").forEach(
        (inp) => (inp.checked = false)
      );

      isMultiSelect = false;
    }
  } else {
    $s(".toolsClose").style.visibility = "visible";

    if (mTools === 1) {
      if (!isMultiSelect) {
        $.documentElement.style.setProperty("--mobileMulti", "flex");
        isMultiSelect = true;
      }

      $.documentElement.style.setProperty("--multiInp", "block");
      $.documentElement.style.setProperty("--multiItemBtns", "none");
      $.documentElement.style.setProperty("--notMultiOption", "none");

      mTools = 2;

      $s(".mobileMulti > .list").innerHTML = "";
      if (route === "inbox") {
        $s(".mobileMulti > .list").insertAdjacentHTML(
          "beforeend",
          mobileMultiSelectBtns.inbox
        );
      } else if (route === "send") {
        $s(".mobileMulti > .list").insertAdjacentHTML(
          "beforeend",
          mobileMultiSelectBtns.send
        );
      } else if (route === "bookmark") {
        $s(".mobileMulti > .list").insertAdjacentHTML(
          "beforeend",
          mobileMultiSelectBtns.bookmark
        );
      } else if (route === "trash") {
        $s(".mobileMulti > .list").insertAdjacentHTML(
          "beforeend",
          mobileMultiSelectBtns.trash
        );
      }

      $sa(".disabled").forEach((elem) => {
        elem.style.pointerEvents = "none";
        elem.setAttribute("disabled", "");
        elem.classList.add("disabled");
        elem.classList.remove("enabled");
      });
    } else {
      if (isMultiSelect) {
        $.documentElement.style.setProperty("--mobileMulti", "none");
        selectedItems = [];
        self.selectedItems = selectedItems;
        $sa(".emkanat > input[type='checkbox']").forEach(
          (inp) => (inp.checked = false)
        );

        isMultiSelect = false;
      }

      $.documentElement.style.setProperty("--multiInp", "none");
      $.documentElement.style.setProperty("--multiItemBtns", "block");
      $.documentElement.style.setProperty("--notMultiOption", "flex");

      mTools = 1;
    }
  }
}

async function itemButtons(type, id) {
  if (type === "delete") {
    if (route === "trash") {
      let confirmMsg = await swConfirm(
        "حذف آیتم!",
        "آیا از حذف کردن این آیتم مطمئن هستید؟"
      );

      if (confirmMsg) {
        $s(".loading").style.display = "flex";
        await hardDelete([id]);
        loadDatas();
      }
    } else {
      let confirmMsg = await swConfirm(
        "حذف آیتم!",
        "آیا از حذف کردن این آیتم مطمئن هستید؟"
      );

      if (confirmMsg) {
        $s(".loading").style.display = "flex";
        await setDelete([id]);
        loadDatas();
      }
    }
  }

  if (type === "restore") {
    $s(".loading").style.display = "flex";
    await unsetDelete([id]);
    loadDatas();
  }

  if (type === "details") {
    try {
      $s(".loading").style.display = "flex";
      const contactDetails = await getContactById(id);
      if (contactDetails) {
        const detailedHtml = getDetailedViewTemplate(contactDetails);
        swHtmlBox(``, detailedHtml, "750px", "500px");
      } else {
        swAlert("error", "خطا!", "جزئیات درخواست یافت نشد.");
      }
    } catch (error) {
      console.error("❌ خطا در نمایش جزئیات:", error);
      swAlert("error", "خطا!", "خطایی در دریافت جزئیات رخ داد.");
    }
  }

  if (type === "seen") {
    $s(".loading").style.display = "flex";
    await readStatus([id], 1);
    loadDatas();
  }

  if (type === "unSeen") {
    $s(".loading").style.display = "flex";
    await readStatus([id], 0);
    loadDatas();
  }

  if (type === "star") {
    $s(".loading").style.display = "flex";
    await starredStatus([id], 1);
    loadDatas();
  }

  if (type === "unStar") {
    $s(".loading").style.display = "flex";
    await starredStatus([id], 0);
    loadDatas();
  }

  if (type === "reply") {
    $s(".loading").style.display = "flex";
    const finalTemp = getReplyTemplate(
      (await getContactById(id)).email,
      (await getContactById(id)).subject,
      (await getContactById(id)).id
    );
    swHtmlBox("", finalTemp, "550px", "535px");
  }
}

async function preBtnFunc(e = event) {
  if (manualCurrent) {
    currentPage = 1;
    $s(".nextBtn").textContent = "صفحه بعدی";
    $s(".nextBtn").style.backgroundColor = "#488aec";
    $s(".preBtn").textContent = "صفحه قبلی";
    $s(".preBtn").style.backgroundColor = "#488aec";
    manualCurrent = false;
    loadDatas();
  } else {
    if (currentPage > 1) {
      currentPage--;
      loadDatas();
    }
  }
}

async function nextBtnFunc(e = event) {
  if ($s("#currentPagesNumInp").value) {
    if (manualCurrent) {
      $s(".nextBtn").textContent = "صفحه بعدی";
      $s(".nextBtn").style.backgroundColor = "#488aec";
      $s(".preBtn").textContent = "صفحه قبلی";
      $s(".preBtn").style.backgroundColor = "#488aec";
      manualCurrent = false;
      loadDatas();
    } else {
      if (currentPage < paginationMax) {
        currentPage++;
        loadDatas();
      }
    }
  } else {
    swAlert("error", "لطفاً شماره صفحه مورد نظر را وارد کنید");
  }
}

function checkLength(text) {
  if (text.length > 17) {
    return text.slice(0, 16) + "...";
  } else {
    return text;
  }
}

function checkSeen(obj) {
  if (obj.isRead === 0) {
    return `<button class="seen" onclick="itemButtons('seen' , ${obj.id})">افزودن به خوانده شده</button>`;
  } else {
    return `<button class="seen" style="background-color: rgb(168 0 8);" onclick="itemButtons('unSeen' , ${obj.id})">‌    ‌ ‌حذف از خوانده شده‌   ‌</button>`;
  }
}

function itemCheckInp(event, id) {
  if (event.target.checked) {
    if (!selectedItems.includes(id)) {
      selectedItems.push(id);
    }
  } else {
    const indexToRemove = selectedItems.indexOf(id);
    if (indexToRemove !== -1) {
      selectedItems.splice(indexToRemove, 1);
    }
  }

  if (selectedItems.length > 0) {
    $sa(".disabled").forEach((elem) => {
      elem.style.pointerEvents = "all";
      elem.removeAttribute("disabled");
      elem.classList.add("enabled");
      elem.classList.remove("disabled");
    });
  } else {
    $sa(".enabled").forEach((elem) => {
      elem.style.pointerEvents = "none";
      elem.setAttribute("disabled", "");
      elem.classList.add("disabled");
      elem.classList.remove("enabled");
    });
  }

  self.selectedItems = selectedItems;
}

function selectAll(type) {
  const allCheckboxes = $sa('.emkanat > input[type="checkbox"]');
  const allHiddenIds = $sa('.emkanat > input[type="hidden"]');

  if (type === false) {
    allCheckboxes.forEach((inp) => {
      inp.checked = false;
    });
    selectedItems = [];
    selectedAll = false;

    $sa(".enabled").forEach((elem) => {
      elem.style.pointerEvents = "none";
      elem.setAttribute("disabled", "");
      elem.classList.add("disabled");
      elem.classList.remove("enabled");
    });
  } else if (!selectedAll) {
    selectedItems = [];
    allCheckboxes.forEach((inp) => {
      inp.checked = true;
    });

    allHiddenIds.forEach((idInput) => {
      selectedItems.push(Number(idInput.value));
    });
    selectedItems = Array.from(new Set(selectedItems));

    if (selectedItems.length > 0) {
      $sa(".disabled").forEach((elem) => {
        elem.style.pointerEvents = "all";
        elem.removeAttribute("disabled");
        elem.classList.add("enabled");
        elem.classList.remove("disabled");
      });

      selectedAll = true;
    } else {
      selectedAll = false;
    }
  } else {
    allCheckboxes.forEach((inp) => {
      inp.checked = false;
    });
    selectedItems = [];

    $sa(".enabled").forEach((elem) => {
      elem.style.pointerEvents = "none";
      elem.setAttribute("disabled", "");
      elem.classList.add("disabled");
      elem.classList.remove("enabled");
    });

    selectedAll = false;
  }

  self.selectedItems = selectedItems;
}

async function openSettingsPopup() {
  swHtmlBox("تنظیمات", settingsTemp, "550px", "500px");

  // بعد از باز شدن پاپ‌آپ، المنت‌ها رو پیدا کن
  const themeColorPicker = document.getElementById("themeColorPicker");
  const fontFamilySelect = document.getElementById("fontFamilySelect");
  const fontSizeSelect = document.getElementById("fontSizeSelect");
  const itemsPerPageInput = document.getElementById("itemsPerPageInput");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const resetSettingsBtn = document.getElementById("resetSettingsBtn");
  const usePinInp = document.getElementById("usePinInp");

  themeColorPicker.value = "#26c";

  // ✅ مقداردهی اولیه فیلدها بر اساس appSettings
  if (themeColorPicker) {
    themeColorPicker.value = appSettings.themeColor;
  }
  if (fontFamilySelect) {
    fontFamilySelect.value = appSettings.fontFamily;
  }
  if (fontSizeSelect) {
    fontSizeSelect.value = appSettings.fontSize;
  }
  if (itemsPerPageInput) {
    itemsPerPageInput.value = appSettings.itemsPerPage;
  }
  if (usePinInp) {
    usePinInp.checked = appSettings.usePin;
    usePinInp.checked
      ? $.documentElement.style.setProperty("--resetPass", "inline-block")
      : $.documentElement.style.setProperty("--resetPass", "none");
  }

  // ✅ مدیریت تغییرات و ذخیره
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", () => {
      // به‌روزرسانی appSettings بر اساس مقادیر جدید
      appSettings.itemsPerPage =
        parseInt(itemsPerPageInput.value) || appSettings.itemsPerPage;
      appSettings.themeColor = themeColorPicker.value;
      appSettings.fontFamily = fontFamilySelect.value;
      appSettings.fontSize = fontSizeSelect.value;
      appSettings.usePin = usePinInp.checked;
      // ذخیره در localStorage
      localStorage.setItem("appSettings", JSON.stringify(appSettings));

      // اعمال تنظیمات به CSS
      applySettingsToCss();

      // به‌روزرسانی متغیر گلوبال indexHistory
      indexHistory = appSettings.itemsPerPage;

      swAlert(
        "success",
        "تنظیمات ذخیره شد!",
        "برای اعمال کامل برخی تغییرات، صفحه را رفرش کنید."
      );
      Swal.close(); // پاپ‌آپ رو ببند
      loadDatas(); // برای اعمال تغییر itemsPerPage و رفرش جدول
    });
  }

  // ✅ مدیریت دکمه ریست تنظیمات
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener("click", async () => {
      const confirmReset = await swConfirm(
        "بازنشانی تنظیمات",
        "آیا از بازنشانی تنظیمات به حالت پیش‌فرض اطمینان دارید؟"
      );
      if (confirmReset) {
        localStorage.removeItem("appSettings"); // حذف تنظیمات ذخیره شده
        localStorage.removeItem("userPin"); // حذف رمزعبور ذخیره شده
        location.reload(); // رفرش صفحه برای اعمال تنظیمات پیش‌فرض
      }
    });
  }
}

function getDetailedViewTemplate(itemData) {
  const name = itemData.name || "نامشخص";
  const phone = itemData.phoneNumber || "شماره تلفن نامشخص";
  const email = itemData.email || "ایمیل نامشخص";
  const subject = itemData.subject || "موضوع نامشخص";
  const message = itemData.message || "متن پیام نامشخص";

  const styles = {
    container: `
      padding: 25px; 
      direction: rtl; 
      text-align: right; 
      font-family: var(--font-family); 
      background-color: var(--bg-color); 
      color: var(--text-color);
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      max-height: 450px; 
      overflow-y: auto;
    `,
    header: `
      font-size: 1.5em; 
      color: var(--theme-color); 
      margin-bottom: 25px; 
      padding-bottom: 12px; 
      border-bottom: 2px solid var(--theme-color);
      display: flex;
      align-items: center;
      gap: 10px;
    `,
    section: `
      margin-bottom: 20px; 
      padding-bottom: 15px; 
      border-bottom: 1px solid rgba(var(--text-color-rgb), 0.2);
    `,
    label: `
      font-weight: bold; 
      color: var(--text-color); 
      display: block; 
      margin-bottom: 8px;
      font-size: 1.1em;
    `,
    value: `
      color: var(--text-color); 
      opacity: 0.9;
      word-wrap: break-word; /* برای شکستن کلمات طولانی */
    `,
    messageContainer: `
      margin-top: 10px;
      padding: 15px;
      background-color: rgb(205 205 205 / 36%);
      border-radius: 8px;
      border: 1px solid rgb(156 156 156);
      line-height: 1.7;
    `,
    icon: `
      font-size: 1.3em; 
      color: var(--theme-color);
    `,
  };

  return `
    <style>
      * {
        border-color: rgb(156 156 156) !important;
      }
    </style>
    <div style="${styles.container}">
      <h2 style="${styles.header}">
        <i class="bi bi-person-lines-fill" style="${styles.icon}"></i>
        جزئیات درخواست
      </h2>
      
      <div style="${styles.section}">
        <label style="${styles.label}">نام و نام خانوادگی:</label>
        <span style="${styles.value}">${name}</span>
      </div>
      
      <div style="${styles.section}">
        <label style="${styles.label}">شماره تلفن:</label>
        <span style="${styles.value}">${phone}</span>
      </div>
      
      <div style="${styles.section}">
        <label style="${styles.label}">ایمیل:</label>
        <span style="${styles.value}">${email}</span>
      </div>
      
      <div style="${styles.section}">
        <label style="${styles.label}">موضوع درخواست:</label>
        <span style="${styles.value}">${subject}</span>
      </div>
      
      <div>
        <label style="${styles.label}">متن پیام:</label>
        <div style="${styles.messageContainer}">${message}</div>
      </div>
    </div>
  `;
}

function getReplyTemplate(recipientEmail = "", subject = "", id) {
  return `
    <style>
        * :not(input , textarea , button) {
          color: var(--text-color) !important;
        }

        body {
          overflow: hidden;
        }
          
        .container {
          width: 100%;
          padding-left: 1rem; /* px-4 */
          padding-right: 1rem; /* px-4 */
          margin-left: auto;
          margin-right: auto;
        }

        input , textarea {
          direction: rtl !important;
          border-color: var(--text-color) !important;
          color: white !important;
        }

        input::placeholder , textarea::placeholder {
          color: white !important;
          direction: rtl !important;
        }

        .mx-auto {
          margin-left: auto;
          margin-right: auto;
        }

        .max-w-md {
          max-width: 28rem; /* max-width for 'md' breakpoint in Tailwind */
        }

        .px-8 {
          padding-left: 2rem; /* px-8 */
          padding-right: 2rem; /* px-8 */
        }

        .py-6 {
          padding-top: 1.5rem; /* py-6 */
          padding-bottom: 1.5rem; /* py-6 */
        }

        .bg-gray-100 {
          background-color: #b6b6b6; /* bg-gray-100 */
        }

        .rounded-lg {
          border-radius: 0.5rem; /* rounded-lg */
        }

        .shadow-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
        }

        .text-2xl {
          font-size: 1.5rem; /* text-2xl */
          line-height: 2rem; /* leading-8 */
        }

        .font-semibold {
          font-weight: 600; /* font-semibold */
        }

        .text-gray-800 {
          color: #1f2937; /* text-gray-800 */
        }

        .mb-4 {
          margin-bottom: 1rem; /* mb-4 */
        }

        .block {
          display: block;
        }

        .mb-1 {
          margin-bottom: 0.25rem; /* mb-1 */
        }

        .w-full {
          width: 100%;
        }

        .focus\:outline-none:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
        }

        .focus\:ring-2:focus {
          --tw-ring-width: 2px;
        }

        .focus\:ring-yellow-300:focus {
          --tw-ring-color: #fcd34d; /* yellow-300 */
        }

        .transition.duration-300 {
          transition-duration: 300ms; /* duration-300 */
          transition-property: color, background-color, border-color, transform,
            box-shadow, filter, -webkit-text-decoration-color, text-decoration-color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bg-gray-200 {
          background-color: #6c6c6cff; /* bg-gray-200 */
        }

        .px-4 {
          padding-left: 1rem; /* px-4 */
          padding-right: 1rem; /* px-4 */
        }

        .py-2 {
          padding-top: 0.5rem; /* py-2 */
          padding-bottom: 0.5rem; /* py-2 */
        }

        .rounded-lg {
          border-radius: 0.5rem; /* rounded-lg */
        }

        .focus\:ring-2:focus {
          --tw-ring-width: 2px;
        }

        .focus\:ring-yellow-300:focus {
          --tw-ring-color: #fcd34d; /* yellow-300 */
        }

        .transition.duration-300 {
          transition-duration: 300ms; /* duration-300 */
          transition-property: color, background-color, border-color, transform,
            box-shadow, filter, -webkit-text-decoration-color, text-decoration-color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bg-yellow-300 {
          background-color: #fcd34d; /* yellow-300 */
        }

        .text-gray-800 {
          color: #1f2937; /* text-gray-800 */
        }

        .py-2 {
          padding-top: 0.5rem; /* py-2 */
          padding-bottom: 0.5rem; /* py-2 */
        }

        .px-4 {
          padding-left: 1rem; /* px-4 */
          padding-right: 1rem; /* px-4 */
        }

        .rounded-lg {
          border-radius: 0.5rem; /* rounded-lg */
        }

        .hover\:bg-yellow-400:hover {
          background-color: #fbbf24; /* yellow-400 */
        }

        .transition.duration-300 {
          transition-duration: 300ms; /* duration-300 */
          transition-property: color, background-color, border-color, transform,
            box-shadow, filter, -webkit-text-decoration-color, text-decoration-color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* برای textarea */
        textarea.w-full.px-4.py-2.bg-gray-200.rounded-lg.focus\:outline-none.focus\:ring-2.focus\:ring-yellow-300.transition.duration-300 {
          /* این استایل‌ها قبلا تعریف شدن، فقط برای اطمینان تکرار می‌شن */
          width: 100%;
          padding: 0.5rem 1rem; /* py-2 px-4 */
          background-color: #e5e7eb; /* bg-gray-200 */
          border-radius: 0.5rem; /* rounded-lg */
          outline: 2px solid transparent;
          outline-offset: 2px;
          --tw-ring-width: 2px;
          --tw-ring-color: #fcd34d; /* yellow-300 */
          transition-duration: 300ms;
          transition-property: color, background-color, border-color, transform,
            box-shadow, filter, -webkit-text-decoration-color, text-decoration-color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        textarea[rows="4"] {
          height: auto; /* یا می‌تونید یه ارتفاع مشخص بدید */
        }

        /* برای دکمه */
        button.w-full.bg-yellow-300.text-gray-800.py-2.px-4.rounded-lg.hover\:bg-yellow-400.transition.duration-300 {
          /* این استایل‌ها قبلا تعریف شدن، فقط برای اطمینان تکرار می‌شن */
          width: 100%;
          background-color: #fcd34d; /* yellow-300 */
          color: #1f2937; /* text-gray-800 */
          padding: 0.5rem 1rem; /* py-2 px-4 */
          border-radius: 0.5rem; /* rounded-lg */
          transition-duration: 300ms;
          transition-property: color, background-color, border-color, transform,
            box-shadow, filter, -webkit-text-decoration-color, text-decoration-color;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        button.w-full.bg-yellow-300.text-gray-800.py-2.px-4.rounded-lg.hover\:bg-yellow-400.transition.duration-300:hover {
          background-color: #fbbf24; /* yellow-400 */
        }
    </style>

    <div class="container px-4 mx-auto">
      <div class="mx-auto">
        <div class="max-w-md mx-auto px-8 py-6 rounded-lg">
          <form>
            <div class="mb-4" oncontextmenu = "return false">
              <label class="block text-gray-800 mb-1" for="email">گیرنده</label>
              <input
                class="w-full px-4 py-2 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 transition duration-300"
                placeholder="ایمیل گیرنده وارد کنید"
                name="email"
                id="email"
                type="email"
                value="${recipientEmail}"
                style="opacity: 0.5; cursor: not-allowed; pointer-events: none;"
                disabled
              />
            </div>

            <div class="mb-4">
              <label class="block text-gray-800 mb-1" for="name">موضوع</label>
              <input
                class="w-full px-4 py-2 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 transition duration-300"
                placeholder="موضوع ایمیل"
                type="text"
                id="name"
                name="name"
                value="${subject}"
              />
            </div>

            <div class="mb-4">
              <label class="block text-gray-800 mb-1" for="message"
                >پیام شما</label
              >
              <textarea
                class="w-full px-4 py-2 bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 transition duration-300"
                rows="4"
                placeholder="پیام خود را وارد کنید"
                name="message"
                id="message"
                style="resize: none; margin-bottom: 1rem;"
              ></textarea>
            </div>

            <button
              onclick="sendEmailFunc(this)"
              style="cursor: pointer"
              class="w-full bg-yellow-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-yellow-400 transition duration-300"
              type="button"
              data-id="${id}"
            >
              ارسال پیام
            </button>
          </form>
        </div>
      </div>
    </div>
    `;
}

async function sendEmailFunc(target) {
  const email = target.parentElement[0].value;
  const subject = target.parentElement[1].value
    ? target.parentElement[1].value
    : "موضوع پیام یافت نشد!";
  const message = target.parentElement[2].value
    ? target.parentElement[2].value
    : "متن پیام یافت نشد!";

  const result = await sendEmail(email, subject, message);

  if (result.message === "ایمیل با موفقیت ارسال شد") {
    await repliedStatus([Number(target.dataset.id)], 1);
    await readStatus([Number(target.dataset.id)], 1);
    loadDatas();
  }
}

function searchBar(e) {
  if ($s("tbody").children.length > 0) {
    const searchedWord = e.target.value.trimStart().toLowerCase();
    const tableBody = $s("table > tbody");

    tableBody.innerHTML = ""; // پاک کردن نتایج قبلی

    if (!searchedWord) {
      //loadDatas(); // اگر کلمه جستجو خالی بود، دوباره همه پیام ها رو نشون بده
      // اگر کلمه جستجو خالی بود، دوباره همه ردیف ها رو به جدول اضافه کن
      allRows.forEach((row) => {
        const newRow = row.cloneNode(true);
        tableBody.appendChild(newRow);
      });
      return;
    }

    let found = false;

    allRows.forEach((row) => {
      // استفاده از ردیف های ذخیره شده
      const name = row.querySelector(".nam").innerText.toLowerCase();
      const subject = row.querySelector(".mozo").innerText.toLowerCase();

      if (name.includes(searchedWord) || subject.includes(searchedWord)) {
        const newRow = row.cloneNode(true);
        tableBody.appendChild(newRow);
        found = true;
      }
    });

    if (!found) {
      tableBody.innerHTML = `<tr><td colspan="4" style="direction: rtl; text-align: center; padding: 1rem;">داده ای برای نمایش یافت نشد !</td></tr>`;
    }
  }
}

async function applyFilters() {
  // 1. Get filter values
  const filterSubject = document
    .getElementById("filterSubject")
    .value.trim()
    .toLowerCase();
  const filterStatus = document.getElementById("filterStatus").value;
  const filterDate = document.getElementById("filterDate").value;
  const sortAlphabetical = document.getElementById("sortAlphabetical").value;

  // 2. Filter messages
  let filteredContacts = [...allContacts]; // Copy the main list

  // Filter subject
  if (filterSubject) {
    filteredContacts = filteredContacts.filter((contact) => {
      const subject = contact.subject ? contact.subject.toLowerCase() : "";
      return subject.includes(filterSubject);
    });
  }

  // Filter status
  if (filterStatus) {
    filteredContacts = filteredContacts.filter((contact) => {
      if (filterStatus === "read") {
        return contact.isRead === 1;
      } else if (filterStatus === "unread") {
        return contact.isRead === 0;
      }
      return true;
    });
  }

  // Filter date
  if (filterDate) {
    filteredContacts = filteredContacts.filter((contact) => {
      if (!contact.createdAt) return false; // Skip if there is no date

      const today = new Date();
      const messageDate = contact.createdAt; // contact.createdAt is already a Date object

      if (filterDate === "today") {
        return messageDate.toDateString() === today.toDateString();
      } else if (filterDate === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return messageDate.toDateString() === yesterday.toDateString();
      } else if (filterDate === "thisWeek") {
        const startOfWeek = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - today.getDay()
        );
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return messageDate >= startOfWeek && messageDate <= endOfWeek;
      } else if (filterDate === "thisMonth") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ); // Last day of current month
        endOfMonth.setHours(23, 59, 59, 999);
        return messageDate >= startOfMonth && messageDate <= endOfMonth;
      }
      return true;
    });
  }

  // 3. Sort
  if (sortAlphabetical) {
    filteredContacts.sort((a, b) => {
      let valueA, valueB;

      if (sortAlphabetical.startsWith("name")) {
        valueA = a.name ? a.name.toLowerCase() : "";
        valueB = b.name ? b.name.toLowerCase() : "";
      } else if (sortAlphabetical.startsWith("subject")) {
        valueA = a.subject ? a.subject.toLowerCase() : "";
        valueB = b.subject ? b.subject.toLowerCase() : "";
      }

      if (valueA < valueB) {
        return sortAlphabetical.endsWith("Asc") ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortAlphabetical.endsWith("Asc") ? 1 : -1;
      }
      return 0;
    });
  }

  // 4. Display filtered messages in the table
  const tableBody = $s("table > tbody");
  tableBody.innerHTML = ""; // Clear previous results

  if (filteredContacts.length > 0) {
    const getButtonsHtml = routeButtons[route];
    filteredContacts.forEach((val, index) => {
      tableBody.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td class="emkanat">
            <input class="userId" type="hidden" value="${val.id}">
            <input style="display: var(--multiInp)" type="checkbox" onchange="itemCheckInp(event ,${
              val.id
            })">
            ${getButtonsHtml(val)}
          </td>
          <td>
            <span class="mozo">${val.subject}</span>
          </td>
          <td>
            <span class="nam">${checkLength(val.name)}</span>
          </td>
          <td>
            <span class="radifNum">${index + 1}</span>
          </td>
        </tr>`
      );
    });
  } else {
    tableBody.innerHTML = `<tr><td colspan="4" style="direction: rtl; text-align: center; padding: 1rem;">داده ای با این فیلتر برای نمایش یافت نشد !</td></tr>`;
  }

  Swal.close(); // Close SweetAlert
}

async function openFilterPopup() {
  if ($s("tbody").children.length > 0) {
    swHtmlBox("فیلتر", filterTemplate, "400px", "auto");
  } else {
    swAlert("info", "داده ای برای فیلتر کردن یافت نشد !");
  }
}

function fixNumberInp(event) {
  let val = event.target.value;
  val.replace(/[^\d]/g, "");
  event.target.value = val;
}

async function resetPassword() {
  let newPass = await swPrompt("رمز عبور جدید را وارد کنید:");

  if (newPass !== null && newPass !== "") {
    newPass = window.btoa(newPass);
    localStorage.setItem("userPin", newPass);
    swAlert("success", "تغییر رمز با موفقیت انجام شد");
  }
}

async function usePinCheck(event) {
  appSettings.usePin = event.target.checked;
  let userPass;

  if (appSettings.usePin) {
    userPass = await swPrompt("یک رمز عبور تعیین کنید:");
    if (userPass !== null && userPass !== "") {
      userPass = window.btoa(userPass);
      localStorage.setItem("userPin", userPass);
      document.documentElement.style.setProperty("--resetPass", "inline-block");
      swAlert("success", "رمز عبور با موفقیت تعیین شد");
    } else {
      event.target.checked = false;
      appSettings.usePin = false;
    }
  } else {
    localStorage.removeItem("userPin");
    document.documentElement.style.setProperty("--resetPass", "none");
  }

  localStorage.setItem("appSettings", JSON.stringify(appSettings));
}

function openMobileTools() {
  if (!mobileToolsOpen) {
    mTools === 1
      ? $.documentElement.style.setProperty("--mobileMenu", "flex")
      : $.documentElement.style.setProperty("--mobileMulti", "flex");

    $s(".toolsClose").style.visibility = "visible";
    mobileToolsOpen = true;
  }
}

// Events
window.addEventListener("load", async () => {
  applySettingsToCss();

  navigator.userAgent.toLowerCase().includes("mobile")
    ? (isMobile = true)
    : (isMobile = false);

  if (localStorage.getItem("userPin") !== null) {
    $s(".loading").style.display = "none";
    $s("header").style.pointerEvents = "none";
    $s("main").style.pointerEvents = "none";
    let getPassword = await swPrompt(
      "رمز عبور را وارد کنید:",
      undefined,
      undefined,
      "خروج",
      "password",
      { autocomplate: "off" }
    );
    if (window.atob(localStorage.getItem("userPin")) == getPassword) {
      $s("header").style.pointerEvents = "all";
      $s("main").style.pointerEvents = "all";
    } else if (getPassword === null) {
      self.close();
    } else {
      await swConfirm("خطا!", "رمز عبور نادرست است", false, "تایید");
      location.reload();
    }
  }

  location.hash = "";
  location.href[location.href.length - 1] === "#"
    ? (location.href = location.href.slice(
        0,
        location.href[location.href.length - 1]
      ))
    : null;

  loadDatas();
  setGlobals();

  if (isMobile) {
    $s(".tools").insertAdjacentHTML("beforeend", mobileToolsBtns);
    $s("main > h4").style.display = "none";
    $sa("*").forEach((elem) => (elem.style.cursor = "none"));
    $sa(".pcTools").forEach((elem) => (elem.style.display = "none"));
    $s("head").insertAdjacentHTML(
      "beforeend",
      `
        <style>
          #searchInp:focus,
          #searchInp:valid {
            cursor: text;
            width: 11rem;
            border-color: var(--theme-color);
          }
        </style>
      `
    );
  } else {
    $s(".tools").insertAdjacentHTML("beforeend", pcToolsBtns);
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "p" && e.ctrlKey === true) {
    e.preventDefault();
    swAlert("info", "از دکمه چاپ در منوی ابزار استفاده کنید");
  }
});

$s(".theme-switch__container").addEventListener("click", themeControl); // این خط همچنان فعال است برای تغییر تم
$s("#themeSwitchBtn").addEventListener("click", () =>
  $s("#themeChanger").checked
    ? ($s("#themeChanger").checked = false)
    : ($s("#themeChanger").checked = true)
);

$s("#searchInp").addEventListener("input", searchBar);
$s("#searchInp").addEventListener("focus", () => {
  document.documentElement.style.setProperty(
    "--search-Place",
    "var(--text-color)"
  );
  searchDatas = [];
  $sa("tbody > tr").forEach((data) => searchDatas.push(data));
});

$s("#menuInp").addEventListener("change", menuFunc);
$s(".menuBtn.settings").addEventListener("click", openSettingsPopup);

$s("#currentPagesNumInp").addEventListener("input", (e) => {
  if (!manualCurrent) {
    $s(".preBtn").textContent = "لغو";
    $s(".preBtn").style.backgroundColor = "rgb(230, 18, 28)";
    $s(".nextBtn").textContent = "تایید";
    $s(".nextBtn").style.backgroundColor = "rgb(28, 185, 46)";

    manualCurrent = true;
  }

  const input = e.target;
  const currentValue = input.value;
  const sanitizedValue = currentValue.replace(/[^\d]/g, "");

  if (currentValue !== sanitizedValue) {
    input.value = sanitizedValue;
  }

  currentPage = e.target.value;

  if (e.target.value[0] === "0") {
    e.target.value = 1;
    currentPage = 1;
  }

  if (e.target.value > paginationMax) {
    e.target.value = paginationMax;
    currentPage = paginationMax;
  }
});

$s(".preBtn").addEventListener("click", preBtnFunc);
$s(".nextBtn").addEventListener("click", nextBtnFunc);

$s(".toolsClose").addEventListener("click", (e) => {
  $.documentElement.style.setProperty("--mobileMenu", "none");
  $.documentElement.style.setProperty("--mobileMulti", "none");
  $s(".toolsClose").style.visibility = "hidden";
  mobileToolsOpen = false;
});

$s(".toolsClose").addEventListener("mouseenter", (e) => {
  $.documentElement.style.setProperty("--mobileMenu", "none");
  $.documentElement.style.setProperty("--mobileMulti", "none");
  $s(".toolsClose").style.visibility = "hidden";
  mobileToolsOpen = false;
});

// Others (Exp Funcs ,...)
function setGlobals() {
  self.$s = $s;
  self.$sa = $sa;
  self.savePage = savePage;
  self.sharePage = sharePage;
  self.loadDatas = loadDatas;
  self.itemButtons = itemButtons;
  self.checkLength = checkLength;
  self.itemCheckInp = itemCheckInp;
  self.hardDelete = hardDelete;
  self.setDelete = setDelete;
  self.unsetDelete = unsetDelete;
  self.repliedStatus = repliedStatus;
  self.selectedItems = selectedItems;
  self.selectAll = selectAll;
  self.selectedAll = selectedAll;
  self.multipleSelect = multipleSelect;
  self.readStatus = readStatus;
  self.starredStatus = starredStatus;
  self.sendEmailFunc = sendEmailFunc;
  self.applyFilters = applyFilters;
  self.openFilterPopup = openFilterPopup;
  self.fixNumberInp = fixNumberInp;
  self.resetPassword = resetPassword;
  self.usePinCheck = usePinCheck;
  self.openMobileTools = openMobileTools;
}

window.screen.availWidth < 325
  ? alert(
      "ابعاد صفحه نمایش شما برای استفاده از این برنامه کافی نیست، از دستگاهی دیگر استفاده کنید یا قابلیت حالت دسکتاپ را در مرورگر فعال کنید و صفحه را رفرش کنید"
    )
  : null;

// Template
const filterTemplate = `
  <style>
    .filter-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      font-family: var(--font-family);
      color: var(--text-color);
      direction: rtl;
    }

    .filter-label {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .filter-input {
      padding: 0.5rem;
      border: 1px solid var(--text-color);
      border-radius: 5px;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-size: var(--font-size);
      font-family: var(--font-family);
      outline: none;
      width: 18rem;
    }

    .filter-select {
      padding: 0.5rem;
      border: 1px solid var(--text-color);
      border-radius: 5px;
      background-color: var(--bg-color);
      color: var(--text-color);
      font-size: var(--font-size);
      font-family: var(--font-family);
      cursor: pointer;
      outline: none;
      width: 18rem;
    }

    .filter-button {
      padding: 1.1rem 1.5rem;
      background-color: var(--theme-color);
      color: #ffffff;
      font-size: 1rem;
      line-height: 1rem;
      font-weight: 700;
      text-align: center;
      cursor: pointer;
      text-transform: uppercase;
      vertical-align: middle;
      align-items: center;
      border-radius: 0.5rem;
      -webkit-user-select: none;
      user-select: none;
      gap: 0.75rem;
      box-shadow: 0 4px 6px -1px #488aec31, 0 2px 4px -1px #488aec17;
      transition: all 0.6s ease;
      border: none;
      outline: none;
      font-family: var(--font-family);
      width: 100%;
    }

    .filter-button:hover {
      box-shadow: 0 10px 15px -3px #488aec4f, 0 4px 6px -2px #488aec17;
    }

    .filter-button:active {
      opacity: 0.85;
      box-shadow: none;
    }
  </style>
  <div class="filter-container">
    <div class="filter-item">
      <label for="filterSubject" class="filter-label">موضوع درخواست:</label>
      <!--<input type="text" id="filterSubject" class="filter-input" placeholder="جستجوی موضوع">-->
      <select id="filterSubject" class="filter-input">
        <option value="">همه موضوعات</option>
        <option value="درخواست همکاری">درخواست همکاری</option>
        <option value="درخواست پشتیبانی">درخواست پشتیبانی</option>
        <option value="پیشنهاد و انتقاد">پیشنهاد و انتقاد</option>
        <option value="سایر">سایر</option>
      </select>
    </div>

    <div class="filter-item">
      <label for="filterStatus" class="filter-label">وضعیت خوانده شده:</label>
      <select id="filterStatus" class="filter-select">
        <option value="">همه وضعیت ها</option>
        <option value="read">خوانده شده</option>
        <option value="unread">خوانده نشده</option>
      </select>
    </div>

    <div class="filter-item">
      <label for="filterDate" class="filter-label">تاریخ:</label>
      <select id="filterDate" class="filter-select">
        <option value="">همه تاریخ ها</option>
        <option value="today">امروز</option>
        <option value="yesterday">دیروز</option>
        <option value="thisWeek">این هفته</option>
        <option value="thisMonth">این ماه</option>
      </select>
    </div>

    <div class="filter-item">
      <label for="sortAlphabetical" class="filter-label">مرتب سازی:</label>
      <select id="sortAlphabetical" class="filter-select">
        <option value="">بدون مرتب سازی</option>
        <option value="nameAsc">اسم (صعودی)</option>
        <option value="nameDesc">اسم (نزولی)</option>
        <option value="subjectAsc">موضوع (صعودی)</option>
        <option value="subjectDesc">موضوع (نزولی)</option>
      </select>
    </div>

    <button class="filter-button" onclick="applyFilters()">اعمال فیلتر</button>
  </div>
`;
