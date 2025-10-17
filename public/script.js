document.addEventListener('DOMContentLoaded', () => {
  // --- Initialize Lucide Icons ---
  lucide.createIcons();

  // --- API Configuration ---
  const API_BASE_URL = ''; // The base is the same domain, so it's empty

  // --- View Elements ---
  const coursesView = document.getElementById('courses-view');
  const materialsView = document.getElementById('materials-view');

  // --- UI Elements ---
  const coursesList = document.getElementById('courses-list');
  const materialsList = document.getElementById('materials-list');
  const courseTitle = document.getElementById('course-title');
  const backToCoursesBtn = document.getElementById('back-to-courses-btn');

  // --- Functions ---

  /**
   * Fetches all courses from the API and displays them.
   */
  async function fetchCourses() {
    coursesList.innerHTML = '<li class="loading">جاري تحميل المواد...</li>';
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const courses = await response.json();
      renderCourses(courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      coursesList.innerHTML = '<li class="error">حدث خطأ أثناء تحميل المواد.</li>';
    }
  }

  /**
   * Renders the list of courses.
   * @param {Array} courses - An array of course objects.
   */
  function renderCourses(courses) {
    coursesList.innerHTML = '';
    if (courses.length === 0) {
      coursesList.innerHTML = '<li>لم يتم إضافة أي مواد دراسية بعد.</li>';
      return;
    }
    courses.forEach(course => {
      const listItem = document.createElement('li');
      listItem.textContent = course.name;
      listItem.dataset.courseId = course.id; // Store course ID in data attribute
      listItem.dataset.courseName = course.name; // Store course name
      coursesList.appendChild(listItem);
    });
  }

  /**
   * Fetches and displays materials for a specific course.
   * @param {string} courseId - The ID of the course.
   * @param {string} courseName - The name of the course.
   */
  async function fetchMaterials(courseId, courseName) {
    showMaterialsView(courseName);
    materialsList.innerHTML = '<li class="loading">جاري تحميل المحتوى...</li>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/materials/${courseId}`);
        if(!response.ok) throw new Error('Network response was not ok');

        const materials = await response.json();
        renderMaterials(materials);
    } catch (error) {
        console.error('Failed to fetch materials:', error);
        materialsList.innerHTML = '<li class="error">حدث خطأ أثناء تحميل المحتوى.</li>';
    }
  }

  /**
   * Renders the list of materials.
   * @param {Array} materials - An array of material objects.
   */
  function renderMaterials(materials) {
    materialsList.innerHTML = '';
    if (materials.length === 0) {
        materialsList.innerHTML = '<li>لا يوجد محتوى لهذه المادة بعد.</li>';
        return;
    }
    materials.forEach(material => {
        const iconName = getIconForMaterialType(material.type);
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="material-icon"><i data-lucide="${iconName}"></i></div>
            <div class="material-info">
                <h3>${material.title}</h3>
                <p>${material.type}</p>
            </div>
        `;
        materialsList.appendChild(listItem);
    });
    lucide.createIcons(); // Re-render icons after adding new ones
  }

  /**
   * Returns an icon name based on the material type.
   * @param {string} type - The material type (e.g., 'lecture').
   * @returns {string} The name of the Lucide icon.
   */
  function getIconForMaterialType(type) {
    switch (type.toLowerCase()) {
      case 'lecture': return 'file-text';
      case 'section': return 'file-pie-chart';
      case 'recording': return 'video';
      case 'summary': return 'clipboard-list';
      default: return 'file';
    }
  }

  // --- View Switching Logic ---
  function showCoursesView() {
    materialsView.classList.add('hidden');
    coursesView.classList.remove('hidden');
  }

  function showMaterialsView(courseName) {
    courseTitle.textContent = courseName;
    coursesView.classList.add('hidden');
    materialsView.classList.remove('hidden');
  }

  // --- Event Listeners ---
  coursesList.addEventListener('click', (event) => {
    if (event.target && event.target.tagName === 'LI') {
      const courseId = event.target.dataset.courseId;
      const courseName = event.target.dataset.courseName;
      if (courseId) {
        fetchMaterials(courseId, courseName);
      }
    }
  });

  backToCoursesBtn.addEventListener('click', showCoursesView);

  // --- Initial Load ---
  fetchCourses();
});

