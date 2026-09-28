/* ============================================================
   NAYAN CLOUD
   CLEAN FINAL APP.JS
============================================================ */

/* ============================================================
   SUPABASE CONFIG
============================================================ */

const SUPABASE_URL =
  "https://pcuefhymomxaxfncskpr.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PcbJ0X0yAGrDIV8M7j6ueg_AsnNbWpv";

const BUCKET =
  "cloud-files";

const USER_QUOTA =
  500 * 1024 * 1024 * 1024;

const MAX_FILE_SIZE =
  500 * 1024 * 1024;


/* ============================================================
   SUPABASE CLIENT
============================================================ */

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce"
      }
    }
  );


/* ============================================================
   GLOBAL STATE
============================================================ */

let currentUser = null;
let files = [];
let currentView = "all";
let selectedFiles = [];
let previewUrls = [];
let loginInProgress = false;
let toastTimer = null;


/* ============================================================
   DOM HELPERS
============================================================ */

const $ = (id) =>
  document.getElementById(id);


/* ============================================================
   LOGIN DOM
============================================================ */

const loginScreen =
  $("loginScreen");

const loginBtn =
  $("loginBtn");

const loginButtonText =
  loginBtn?.querySelector(".google-text") ||
  $("loginButtonText");

const loginLoader =
  $("loginLoader");

const loginMessage =
  $("loginMessage");


/* ============================================================
   APP DOM
============================================================ */

const appScreen =
  $("appScreen");

const uploadBtn =
  $("uploadBtn");

const emptyUploadBtn =
  $("emptyUploadBtn");

const fileInput =
  $("fileInput");

const logoutBtn =
  $("logoutBtn");

const refreshBtn =
  $("refreshBtn");

const searchInput =
  $("searchInput");

const fileGrid =
  $("fileGrid");

const emptyState =
  $("emptyState");

const notice =
  $("notice");

const userName =
  $("userName");

const userEmail =
  $("userEmail");

const userAvatar =
  $("userAvatar");


/* ============================================================
   STORAGE DOM
============================================================ */

const storageFill =
  $("storageFill");

const storageUsed =
  $("storageUsed");

const storagePercent =
  $("storagePercent");


/* ============================================================
   PROGRESS DOM
============================================================ */

const uploadProgress =
  $("uploadProgress");

const progressFill =
  $("progressFill");

const progressText =
  $("progressText");

const progressPercent =
  $("progressPercent");


/* ============================================================
   COUNTS
============================================================ */

const fileCount =
  $("fileCount");

const allCount =
  $("allCount");

const imageCount =
  $("imageCount");

const videoCount =
  $("videoCount");

const documentCount =
  $("documentCount");


/* ============================================================
   TITLES
============================================================ */

const viewTitle =
  $("viewTitle");

const sectionTitle =
  $("sectionTitle");


/* ============================================================
   UPLOAD MODAL
============================================================ */

const uploadModal =
  $("uploadModal");

const modalBackdrop =
  $("modalBackdrop");

const modalClose =
  $("modalClose");

const dropZone =
  $("dropZone");

const selectedFilesBox =
  $("selectedFiles");

const modalUploadBtn =
  $("modalUploadBtn");


/* ============================================================
   TOAST
============================================================ */

const toast =
  $("toast");


/* ============================================================
   BASIC HELPERS
============================================================ */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ============================================================
   AUTH ERROR DETAILS
============================================================ */

function getAuthErrorDetails(error) {

  if (!error) {
    return "Unknown error.";
  }

  if (typeof error === "string") {
    return error;
  }

  const message =
    error.message ||
    error.error_description ||
    error.description ||
    error.error ||
    "Unknown error.";

  const code =
    error.code ||
    error.error_code ||
    error.status;

  if (code) {
    return `${message} (Code: ${code})`;
  }

  return message;

}


/* ============================================================
   LOGIN MESSAGE
============================================================ */

function setLoginMessage(
  message = "",
  isError = false
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.style.display =
    message ? "block" : "none";

  loginMessage.style.color =
    isError
      ? "#ff6b6b"
      : "";

}


/* ============================================================
   LOGIN BUTTON RESET
============================================================ */

function resetLoginButton() {

  loginInProgress = false;

  if (loginBtn) {

    loginBtn.disabled =
      false;

    loginBtn.removeAttribute(
      "aria-busy"
    );

  }

  if (loginButtonText) {

    loginButtonText.textContent =
      "Continue with Google";

  }

  if (loginLoader) {

    loginLoader.classList.add(
      "hidden"
    );

  }

}


/* ============================================================
   GOOGLE LOGIN
============================================================ */

async function loginWithGoogle() {

  if (loginInProgress) {
    return;
  }

  loginInProgress = true;

  setLoginMessage("");

  if (loginBtn) {

    loginBtn.disabled =
      true;

    loginBtn.setAttribute(
      "aria-busy",
      "true"
    );

  }

  if (loginButtonText) {

    loginButtonText.textContent =
      "Connecting...";

  }

  if (loginLoader) {

    loginLoader.classList.remove(
      "hidden"
    );

  }

  try {

    const redirectTo =
      "https://asomi5520.github.io/NAYAN-CLOUD/";

    console.log(
      "[NAYAN CLOUD] Google login starting..."
    );

    console.log(
      "[NAYAN CLOUD] Redirect URL:",
      redirectTo
    );

    const {
      data,
      error
    } =
      await db.auth.signInWithOAuth({

        provider:
          "google",

        options: {

          redirectTo,

          queryParams: {

            access_type:
              "offline",

            prompt:
              "select_account"

          }

        }

      });


    if (error) {

      console.error(
        "[NAYAN CLOUD] Google OAuth error:",
        error
      );

      setLoginMessage(
        `Google login failed: ${getAuthErrorDetails(error)}`,
        true
      );

      resetLoginButton();

      return;

    }


    if (!data?.url) {

      console.error(
        "[NAYAN CLOUD] OAuth URL missing.",
        data
      );

      setLoginMessage(
        "Google login could not start. Supabase did not return an OAuth URL.",
        true
      );

      resetLoginButton();

      return;

    }


    console.log(
      "[NAYAN CLOUD] Google OAuth started successfully."
    );

    /*
      Supabase handles the browser redirect.
      Do not manually redirect.
    */

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] Google login exception:",
      error
    );

    setLoginMessage(
      `Unable to start Google login: ${getAuthErrorDetails(error)}`,
      true
    );

    resetLoginButton();

  }

}


/* ============================================================
   OAUTH RETURN ERROR
============================================================ */

function checkOAuthRedirectError() {

  try {

    const hashParams =
      new URLSearchParams(
        window.location.hash.replace(
          /^#/,
          ""
        )
      );

    const searchParams =
      new URLSearchParams(
        window.location.search
      );


    const error =
      hashParams.get("error") ||
      searchParams.get("error");


    const errorCode =
      hashParams.get("error_code") ||
      searchParams.get("error_code");


    const errorDescription =
      hashParams.get("error_description") ||
      searchParams.get("error_description");


    if (
      !error &&
      !errorCode &&
      !errorDescription
    ) {

      return;

    }


    let message =
      errorDescription ||
      error ||
      "Google authentication failed.";


    try {

      message =
        decodeURIComponent(message);

    }

    catch (_) {

      /* Keep original message */

    }


    if (errorCode) {

      message +=
        ` (Code: ${errorCode})`;

    }


    console.error(
      "[NAYAN CLOUD] OAuth redirect error:",
      {
        error,
        errorCode,
        errorDescription
      }
    );


    setLoginMessage(
      `Google login failed: ${message}`,
      true
    );


    resetLoginButton();


    /*
      Clean error parameters
      from visible URL.
    */

    try {

      const cleanUrl =
        window.location.origin +
        window.location.pathname;

      window.history.replaceState(
        {},
        document.title,
        cleanUrl
      );

    }

    catch (historyError) {

      console.warn(
        "[NAYAN CLOUD] Could not clean OAuth URL:",
        historyError
      );

    }

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] OAuth error inspection failed:",
      error
    );

  }

}


/* ============================================================
   LOGIN / APP SCREEN
============================================================ */

function showLogin() {

  loginScreen?.classList.remove(
    "hidden"
  );

  appScreen?.classList.add(
    "hidden"
  );

}


function showApp() {

  loginScreen?.classList.add(
    "hidden"
  );

  appScreen?.classList.remove(
    "hidden"
  );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(
  message,
  isError = false
) {

  if (!toast) {
    return;
  }

  clearTimeout(
    toastTimer
  );

  toast.textContent =
    message || "";

  toast.dataset.type =
    isError
      ? "error"
      : "success";

  toast.classList.remove(
    "hidden"
  );

  toast.classList.add(
    "show"
  );

  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

      toast.classList.add(
        "hidden"
      );

    }, 4000);

}


/* ============================================================
   NOTICE
============================================================ */

function showNotice(
  message,
  isError = false
) {

  if (!notice) {
    return;
  }

  notice.textContent =
    message || "";

  notice.classList.remove(
    "hidden"
  );

  notice.classList.toggle(
    "error",
    isError
  );

}


function hideNotice() {

  notice?.classList.add(
    "hidden"
  );

}


/* ============================================================
   FORMAT SIZE
============================================================ */

function formatSize(bytes) {

  bytes =
    Number(bytes || 0);

  if (bytes <= 0) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
  ];

  const index =
    Math.min(
      Math.floor(
        Math.log(bytes) /
        Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    bytes /
    Math.pow(
      1024,
      index
    );

  return `${value.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;

}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(value) {

  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


/* ============================================================
   FILE TYPE
============================================================ */

function getFileType(
  fileName
) {

  const extension =
    String(fileName || "")
      .split(".")
      .pop()
      .toLowerCase();


  const imageTypes = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    "bmp"
  ];


  const videoTypes = [
    "mp4",
    "webm",
    "mov",
    "m4v"
  ];


  const audioTypes = [
    "mp3",
    "wav",
    "ogg",
    "m4a"
  ];


  const documentTypes = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "csv",
    "ppt",
    "pptx",
    "txt"
  ];


  if (
    imageTypes.includes(
      extension
    )
  ) {

    return "image";

  }


  if (
    videoTypes.includes(
      extension
    )
  ) {

    return "video";

  }


  if (
    audioTypes.includes(
      extension
    )
  ) {

    return "audio";

  }


  if (
    documentTypes.includes(
      extension
    )
  ) {

    return "document";

  }


  return "other";

}


/* ============================================================
   FILE ICON
============================================================ */

function getFileIcon(
  fileName
) {

  const extension =
    String(fileName || "")
      .split(".")
      .pop()
      .toLowerCase();


  const icons = {

    pdf:
      "fa-file-pdf",

    doc:
      "fa-file-word",

    docx:
      "fa-file-word",

    xls:
      "fa-file-excel",

    xlsx:
      "fa-file-excel",

    csv:
      "fa-file-excel",

    ppt:
      "fa-file-powerpoint",

    pptx:
      "fa-file-powerpoint",

    txt:
      "fa-file-lines",

    jpg:
      "fa-file-image",

    jpeg:
      "fa-file-image",

    png:
      "fa-file-image",

    gif:
      "fa-file-image",

    webp:
      "fa-file-image",

    svg:
      "fa-file-image",

    mp4:
      "fa-file-video",

    webm:
      "fa-file-video",

    mov:
      "fa-file-video",

    mp3:
      "fa-file-audio",

    wav:
      "fa-file-audio",

    zip:
      "fa-file-zipper",

    rar:
      "fa-file-zipper",

    "7z":
      "fa-file-zipper"

  };


  return (
    icons[extension] ||
    "fa-file"
  );

}


/* ============================================================
   USER FOLDER
============================================================ */

function getUserFolder() {

  if (!currentUser?.id) {

    throw new Error(
      "User session is missing."
    );

  }

  return currentUser.id;

}


/* ============================================================
   USER UI
============================================================ */

function updateUserUI(
  user
) {

  if (!user) {
    return;
  }

  const metadata =
    user.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    user.email ||
    "User";

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    "";


  if (userName) {

    userName.textContent =
      name;

  }


  if (userEmail) {

    userEmail.textContent =
      user.email || "";

  }


  if (userAvatar) {

    if (avatar) {

      userAvatar.src =
        avatar;

      userAvatar.alt =
        name;

    }

    else {

      userAvatar.removeAttribute(
        "src"
      );

      userAvatar.alt =
        name;

    }

  }

}


/* ============================================================
   FILE CATEGORY
============================================================ */

function fileMatchesView(
  file
) {

  if (
    currentView ===
    "all"
  ) {

    return true;

  }

  return (
    getFileType(
      file.file_name
    ) === currentView
  );

}


/* ============================================================
   LOAD FILES
============================================================ */

async function loadFiles() {

  if (!currentUser) {
    return;
  }

  try {

    showLoadingState();


    const {
      data,
      error
    } =
      await db
        .from("user_files")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    files =
      Array.isArray(data)
        ? data
        : [];


    updateStorageUI();

    updateCounts();

    renderFiles();

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] Load files error:",
      error
    );

    files = [];

    updateStorageUI();

    updateCounts();

    renderFiles();


    showToast(
      `Could not load files: ${getAuthErrorDetails(error)}`,
      true
    );

  }

  finally {

    hideLoadingState();

  }

}


/* ============================================================
   RENDER FILES
============================================================ */

function renderFiles() {

  if (!fileGrid) {
    return;
  }


  const query =
    searchInput?.value
      ?.trim()
      .toLowerCase() ||
    "";


  let visibleFiles =
    files.filter(
      file =>
        fileMatchesView(file)
    );


  if (query) {

    visibleFiles =
      visibleFiles.filter(
        file =>
          String(
            file.file_name || ""
          )
            .toLowerCase()
            .includes(query)
      );

  }


  fileGrid.innerHTML =
    "";


  if (!visibleFiles.length) {

    emptyState?.classList.remove(
      "hidden"
    );

    return;

  }


  emptyState?.classList.add(
    "hidden"
  );


  visibleFiles.forEach(
    file => {

      fileGrid.appendChild(
        createFileCard(file)
      );

    }
  );

}


/* ============================================================
   CREATE FILE CARD
============================================================ */

function createFileCard(
  file
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "file-card";


  const fileName =
    file.file_name ||
    "Unnamed file";


  const type =
    getFileType(
      fileName
    );


  const icon =
    getFileIcon(
      fileName
    );


  const size =
    formatSize(
      Number(
        file.file_size || 0
      )
    );


  const date =
    formatDate(
      file.created_at
    );


  card.innerHTML = `

    <div class="file-card-icon">

      <i class="fa-solid ${icon}"></i>

    </div>

    <div class="file-card-info">

      <h3
        title="${escapeHtml(fileName)}"
      >
        ${escapeHtml(fileName)}
      </h3>

      <p>
        ${escapeHtml(size)}
        ${date
          ? ` • ${escapeHtml(date)}`
          : ""}
      </p>

    </div>

    <div class="file-card-actions">

      <button
        type="button"
        class="file-action"
        data-action="preview"
        title="Preview"
      >
        <i class="fa-solid fa-eye"></i>
      </button>

      <button
        type="button"
        class="file-action"
        data-action="download"
        title="Download"
      >
        <i class="fa-solid fa-download"></i>
      </button>

      <button
        type="button"
        class="file-action danger"
        data-action="delete"
        title="Delete"
      >
        <i class="fa-solid fa-trash"></i>
      </button>

    </div>

  `;


  card
    .querySelectorAll(
      "[data-action]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            const action =
              button.dataset.action;


            if (
              action ===
              "preview"
            ) {

              previewFile(file);

            }


            if (
              action ===
              "download"
            ) {

              downloadFile(file);

            }


            if (
              action ===
              "delete"
            ) {

              deleteFile(file);

            }

          }
        );

      }
    );


  card.addEventListener(
    "dblclick",
    () => {

      previewFile(file);

    }
  );


  return card;

}


/* ============================================================
   UPDATE COUNTS
============================================================ */

function updateCounts() {

  const all =
    files.length;


  const images =
    files.filter(
      file =>
        getFileType(
          file.file_name
        ) === "image"
    ).length;


  const videos =
    files.filter(
      file =>
        getFileType(
          file.file_name
        ) === "video"
    ).length;


  const documents =
    files.filter(
      file =>
        getFileType(
          file.file_name
        ) === "document"
    ).length;


  if (allCount) {
    allCount.textContent =
      all;
  }

  if (imageCount) {
    imageCount.textContent =
      images;
  }

  if (videoCount) {
    videoCount.textContent =
      videos;
  }

  if (documentCount) {
    documentCount.textContent =
      documents;
  }

  if (fileCount) {
    fileCount.textContent =
      all;
  }

}


/* ============================================================
   STORAGE UI
============================================================ */

function updateStorageUI() {

  const usedBytes =
    files.reduce(
      (
        total,
        file
      ) =>
        total +
        Number(
          file.file_size || 0
        ),
      0
    );


  const percent =
    Math.min(
      (
        usedBytes /
        USER_QUOTA
      ) * 100,
      100
    );


  if (storageFill) {

    storageFill.style.width =
      `${percent}%`;

  }


  if (storageUsed) {

    storageUsed.textContent =
      formatSize(
        usedBytes
      );

  }


  if (storagePercent) {

    storagePercent.textContent =
      `${percent.toFixed(2)}%`;

  }

}


/* ============================================================
   LOADING STATE
============================================================ */

function showLoadingState() {

  if (!fileGrid) {
    return;
  }

  fileGrid.innerHTML = `
    <div class="loading-state">
      Loading your files...
    </div>
  `;

}


/* ============================================================
   HIDE LOADING STATE
============================================================ */

function hideLoadingState() {

  /*
    renderFiles() controls the final state.
  */

}


/* ============================================================
   UPLOAD MODAL
============================================================ */

function openUploadModal() {

  if (!currentUser) {

    showToast(
      "Please sign in first.",
      true
    );

    return;

  }


  selectedFiles = [];

  renderSelectedFiles();


  uploadModal?.classList.remove(
    "hidden"
  );

}


/* ============================================================
   CLOSE UPLOAD MODAL
============================================================ */

function closeUploadModal() {

  uploadModal?.classList.add(
    "hidden"
  );


  selectedFiles = [];

  renderSelectedFiles();


  if (fileInput) {

    fileInput.value =
      "";

  }

}


/* ============================================================
   ADD SELECTED FILES
============================================================ */

function addSelectedFiles(
  fileList
) {

  const incoming =
    Array.from(
      fileList || []
    );


  if (!incoming.length) {
    return;
  }


  for (
    const file of incoming
  ) {

    const alreadyExists =
      selectedFiles.some(
        selected =>
          selected.name ===
            file.name &&
          selected.size ===
            file.size &&
          selected.lastModified ===
            file.lastModified
      );


    if (
      !alreadyExists
    ) {

      selectedFiles.push(
        file
      );

    }

  }


  renderSelectedFiles();

}


/* ============================================================
   RENDER SELECTED FILES
============================================================ */

function renderSelectedFiles() {

  if (!selectedFilesBox) {
    return;
  }


  selectedFilesBox.innerHTML =
    "";


  if (!selectedFiles.length) {

    selectedFilesBox.innerHTML = `
      <div class="selected-empty">
        No files selected.
      </div>
    `;

    if (modalUploadBtn) {
      modalUploadBtn.disabled =
        true;
    }

    return;

  }


  if (modalUploadBtn) {
    modalUploadBtn.disabled =
      false;
  }


  selectedFiles.forEach(
    (
      file,
      index
    ) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "selected-file";


      item.innerHTML = `

        <div>

          <strong>
            ${escapeHtml(
              file.name
            )}
          </strong>

          <small>
            ${formatSize(
              file.size
            )}
          </small>

        </div>

        <button
          type="button"
          data-remove="${index}"
          title="Remove"
        >
          ×
        </button>

      `;


      item
        .querySelector(
          "[data-remove]"
        )
        ?.addEventListener(
          "click",
          () => {

            selectedFiles.splice(
              index,
              1
            );

            renderSelectedFiles();

          }
        );


      selectedFilesBox.appendChild(
        item
      );

    }
  );

}


/* ============================================================
   UPLOAD SELECTED FILES
============================================================ */

async function uploadSelectedFiles() {

  if (!currentUser) {

    showToast(
      "Please sign in first.",
      true
    );

    return;

  }


  if (!selectedFiles.length) {

    showToast(
      "Please select at least one file.",
      true
    );

    return;

  }


  const filesToUpload =
    [...selectedFiles];


  const currentUsed =
    files.reduce(
      (
        total,
        file
      ) =>
        total +
        Number(
          file.file_size || 0
        ),
      0
    );


  const incomingSize =
    filesToUpload.reduce(
      (
        total,
        file
      ) =>
        total +
        Number(
          file.size || 0
        ),
      0
    );


  if (
    currentUsed +
    incomingSize >
    USER_QUOTA
  ) {

    showToast(
      "Storage quota exceeded.",
      true
    );

    return;

  }


  if (uploadProgress) {

    uploadProgress.classList.remove(
      "hidden"
    );

  }


  if (modalUploadBtn) {

    modalUploadBtn.disabled =
      true;

  }


  let completed =
    0;

  const errors = [];


  for (
    const file of filesToUpload
  ) {

    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      errors.push(
        `${file.name}: file is larger than the allowed upload size.`
      );

      continue;

    }


    try {

      if (progressText) {

        progressText.textContent =
          `Uploading ${file.name}`;

      }


      const folder =
        getUserFolder();


      const safeName =
        file.name
          .replace(
            /[^\w.\-() ]+/g,
            "_"
          )
          .trim() ||
        "file";


      const uniqueName =
        `${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 10)}_${safeName}`;


      const path =
        `${folder}/${uniqueName}`;


      const {
        error:
          uploadError
      } =
        await db.storage
          .from(BUCKET)
          .upload(
            path,
            file,
            {
              upsert: false,
              contentType:
                file.type ||
                "application/octet-stream",
              cacheControl:
                "3600"
            }
          );


      if (uploadError) {

        throw uploadError;

      }


      const {
        error:
          recordError
      } =
        await db
          .from("user_files")
          .insert({

            user_id:
              currentUser.id,

            file_name:
              file.name,

            object_path:
              path,

            mime_type:
              file.type ||
              "application/octet-stream",

            file_size:
              file.size

          });


      if (recordError) {

        /*
          If database record fails,
          remove the uploaded object.
        */

        await db.storage
          .from(BUCKET)
          .remove([
            path
          ]);

        throw recordError;

      }


      completed++;


      const percent =
        Math.round(
          (
            completed /
            filesToUpload.length
          ) * 100
        );


      updateProgress(
        percent
      );

    }

    catch (error) {

      console.error(
        "[NAYAN CLOUD] Upload error:",
        error
      );

      errors.push(
        `${file.name}: ${getAuthErrorDetails(error)}`
      );

    }

  }


  updateProgress(
    100
  );


  if (progressText) {

    progressText.textContent =
      "Upload finished.";

  }


  setTimeout(
    () => {

      uploadProgress?.classList.add(
        "hidden"
      );

    },
    700
  );


  if (errors.length) {

    showToast(
      errors.join(" | "),
      true
    );

  }


  if (completed > 0) {

    showToast(
      `${completed} file${completed === 1 ? "" : "s"} uploaded successfully.`
    );

  }


  closeUploadModal();

  await loadFiles();

}


/* ============================================================
   UPDATE UPLOAD PROGRESS
============================================================ */

function updateProgress(
  percent
) {

  const safePercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );


  if (progressFill) {

    progressFill.style.width =
      `${safePercent}%`;

  }


  if (progressPercent) {

    progressPercent.textContent =
      `${safePercent}%`;

  }

}


/* ============================================================
   DOWNLOAD FILE
============================================================ */

async function downloadFile(
  file
) {

  if (!currentUser) {
    return;
  }


  try {

    showToast(
      "Preparing download..."
    );


    const {
      data,
      error
    } =
      await db.storage
        .from(BUCKET)
        .createSignedUrl(
          file.object_path,
          300
        );


    if (
      error ||
      !data?.signedUrl
    ) {

      throw new Error(
        error?.message ||
        "Could not create download link."
      );

    }


    const link =
      document.createElement(
        "a"
      );


    link.href =
      data.signedUrl;

    link.download =
      file.file_name ||
      "download";

    link.target =
      "_blank";

    link.rel =
      "noopener";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] Download error:",
      error
    );

    showToast(
      `Download failed: ${getAuthErrorDetails(error)}`,
      true
    );

  }

}


/* ============================================================
   DELETE FILE
============================================================ */

async function deleteFile(
  file
) {

  if (!currentUser) {
    return;
  }


  const fileName =
    file.file_name ||
    "this file";


  const confirmed =
    window.confirm(
      `Permanently delete "${fileName}"?`
    );


  if (!confirmed) {
    return;
  }


  try {

    showToast(
      "Deleting file..."
    );


    const {
      error:
        storageError
    } =
      await db.storage
        .from(BUCKET)
        .remove([
          file.object_path
        ]);


    if (storageError) {

      throw storageError;

    }


    const {
      error:
        databaseError
    } =
      await db
        .from("user_files")
        .delete()
        .eq(
          "id",
          file.id
        )
        .eq(
          "user_id",
          currentUser.id
        );


    if (databaseError) {

      throw databaseError;

    }


    showToast(
      "File deleted successfully."
    );


    await loadFiles();

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] Delete error:",
      error
    );

    showToast(
      `Delete failed: ${getAuthErrorDetails(error)}`,
      true
    );

  }

}


/* ============================================================
   PREVIEW FILE
============================================================ */

async function previewFile(
  file
) {

  if (!currentUser) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await db.storage
        .from(BUCKET)
        .download(
          file.object_path
        );


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        "Preview file is empty."
      );

    }


    previewUrls.forEach(
      url =>
        URL.revokeObjectURL(
          url
        )
    );


    previewUrls = [];


    /*
      Use existing preview modal
      if present in the HTML.
    */

    const previewModal =
      $("previewModal");

    const previewContent =
      $("previewContent");

    const previewTitle =
      $("previewTitle");

    const closePreviewBtn =
      $("closePreviewBtn");


    if (
      !previewModal ||
      !previewContent
    ) {

      /*
        Browser fallback when preview
        modal is not present.
      */

      const url =
        URL.createObjectURL(
          data
        );

      window.open(
        url,
        "_blank",
        "noopener"
      );

      setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        60000
      );

      return;

    }


    const url =
      URL.createObjectURL(
        data
      );


    previewUrls.push(
      url
    );


    if (previewTitle) {

      previewTitle.textContent =
        file.file_name ||
        "Preview";

    }


    previewContent.innerHTML =
      "";


    const type =
      getFileType(
        file.file_name
      );


    if (
      type ===
      "image"
    ) {

      const img =
        document.createElement(
          "img"
        );

      img.src =
        url;

      img.alt =
        file.file_name ||
        "Image";

      previewContent.appendChild(
        img
      );

    }


    else if (
      type ===
      "video"
    ) {

      const video =
        document.createElement(
          "video"
        );

      video.src =
        url;

      video.controls =
        true;

      video.autoplay =
        false;

      previewContent.appendChild(
        video
      );

    }


    else if (
      type ===
      "audio"
    ) {

      const audio =
        document.createElement(
          "audio"
        );

      audio.src =
        url;

      audio.controls =
        true;

      previewContent.appendChild(
        audio
      );

    }


    else if (
      type ===
        "document" &&
      String(
        file.file_name || ""
      )
        .toLowerCase()
        .endsWith(".pdf")
    ) {

      const frame =
        document.createElement(
          "iframe"
        );

      frame.src =
        url;

      frame.title =
        file.file_name ||
        "PDF";

      previewContent.appendChild(
        frame
      );

    }


    else {

      const wrapper =
        document.createElement(
          "div"
        );


      wrapper.className =
        "preview-fallback";


      wrapper.innerHTML = `

        <i class="fa-solid ${getFileIcon(
          file.file_name
        )}"></i>

        <h3>
          ${escapeHtml(
            file.file_name
          )}
        </h3>

        <p>
          Preview is not available for this file type.
        </p>

        <button
          type="button"
          class="btn btn-primary"
          id="previewDownloadBtn"
        >
          Download File
        </button>

      `;


      previewContent.appendChild(
        wrapper
      );


      wrapper
        .querySelector(
          "#previewDownloadBtn"
        )
        ?.addEventListener(
          "click",
          () =>
            downloadFile(file)
        );

    }


    previewModal.classList.remove(
      "hidden"
    );


    closePreviewBtn?.focus();

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] Preview error:",
      error
    );

    showToast(
      `Preview failed: ${getAuthErrorDetails(error)}`,
      true
    );

  }

}


/* ============================================================
   CLOSE PREVIEW
============================================================ */

function closePreview() {

  const previewModal =
    $("previewModal");

  const previewContent =
    $("previewContent");


  previewUrls.forEach(
    url =>
      URL.revokeObjectURL(
        url
      )
  );


  previewUrls = [];


  if (previewContent) {

    previewContent.innerHTML =
      "";

  }


  previewModal?.classList.add(
    "hidden"
  );

}


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

  document
    .querySelectorAll(
      "[data-view]"
    )
    .forEach(
      item => {

        item.addEventListener(
          "click",
          () => {

            currentView =
              item.dataset.view ||
              "all";


            document
              .querySelectorAll(
                "[data-view]"
              )
              .forEach(
                nav => {

                  nav.classList.toggle(
                    "active",
                    nav === item
                  );

                }
              );


            const titles = {

              all:
                "All files",

              images:
                "Photos",

              videos:
                "Videos",

              documents:
                "Documents",

              audio:
                "Audio"

            };


            const title =
              titles[
                currentView
              ] ||
              "All files";


            if (viewTitle) {

              viewTitle.textContent =
                title;

            }


            if (sectionTitle) {

              sectionTitle.textContent =
                currentView === "all"
                  ? "Your files"
                  : title;

            }


            renderFiles();

          }
        );

      }
    );

}


/* ============================================================
   LOGOUT
============================================================ */

async function logout() {

  if (!currentUser) {
    return;
  }


  if (logoutBtn) {

    logoutBtn.disabled =
      true;

  }


  try {

    const {
      error
    } =
      await db.auth.signOut();


    if (error) {

      throw error;

    }


    currentUser =
      null;

    files =
      [];

    selectedFiles =
      [];


    showLogin();

    resetLoginButton();

    setLoginMessage("");

  }

  catch (error) {

    console.error(
      "[NAYAN CLOUD] Logout error:",
      error
    );

    showToast(
      `Logout failed: ${getAuthErrorDetails(error)}`,
      true
    );

  }

  finally {

    if (logoutBtn) {

      logoutBtn.disabled =
        false;

    }

  }

}


/* ============================================================
   AUTH INITIALIZATION
============================================================ */

async function initializeAuth() {

  console.log(
    "NAYAN CLOUD: Initializing authentication..."
  );

  loginScreen?.classList.add("hidden");
  appScreen?.classList.add("hidden");

  try {

    /* =========================================================
       GOOGLE OAUTH / PKCE CODE
    ========================================================= */

    const url = new URL(
      window.location.href
    );

    const code =
      url.searchParams.get("code");

    if (code) {

      console.log(
        "NAYAN CLOUD: OAuth code detected."
      );

      const {
        data,
        error
      } =
        await db.auth.exchangeCodeForSession(
          code
        );

      if (error) {

        console.error(
          "NAYAN CLOUD: OAuth code exchange failed:",
          error
        );

        resetLoginButton();

        showLogin();

        setLoginMessage(
          "Google login failed: " +
          (error.message ||
            "Unable to create session."),
          true
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.origin +
          window.location.pathname
        );

        return;
      }

      console.log(
        "NAYAN CLOUD: OAuth session created."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.origin +
        window.location.pathname
      );

      if (data?.session?.user) {

        currentUser =
          data.session.user;

        resetLoginButton();

        await enterApp(
          currentUser
        );

        return;
      }
    }

    /* =========================================================
       NORMAL SESSION CHECK
    ========================================================= */

    const {
      data,
      error
    } =
      await db.auth.getSession();

    if (error) {

      console.error(
        "NAYAN CLOUD: Session error:",
        error
      );

      resetLoginButton();

      showLogin();

      setLoginMessage(
        "Session could not be restored.",
        true
      );

      return;
    }

    const session =
      data?.session;

    if (session?.user) {

      console.log(
        "NAYAN CLOUD: Existing session:",
        session.user.email
      );

      currentUser =
        session.user;

      resetLoginButton();

      await enterApp(
        session.user
      );

    } else {

      console.log(
        "NAYAN CLOUD: No active session."
      );

      resetLoginButton();

      showLogin();

    }

  } catch (error) {

    console.error(
      "NAYAN CLOUD: Authentication initialization error:",
      error
    );

    currentUser = null;

    resetLoginButton();

    showLogin();

    setLoginMessage(
      "Authentication failed: " +
      (error?.message ||
        "Unknown authentication error."),
      true
    );
  }
}
/* ============================================================
   EVENT LISTENERS
============================================================ */

loginBtn?.addEventListener(
  "click",
  loginWithGoogle
);


/* ============================================================
   APP INITIALIZATION
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupNavigation();

    initializeAuth();

  }
);
