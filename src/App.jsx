import { useState, useEffect } from 'react';

function App() {
  // 1. Dark Mode & View State
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('aio-theme') === 'dark');
  const [activeView, setActiveView] = useState('list'); 

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aio-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aio-theme', 'light');
    }
  }, [isDarkMode]);

  // 2. Live Time Engine
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const current24HourTime = currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const currentDayStr = currentTime.toLocaleDateString('en-US', { weekday: 'long' });

  // 3. Master Semester Engine
  const [allSchedules, setAllSchedules] = useState(() => {
    const saved = localStorage.getItem('aio-schedules');
    return saved ? JSON.parse(saved) : { 'Monsoon 2026': [] };
  });
  const [activeSemester, setActiveSemester] = useState(() => localStorage.getItem('aio-active-sem') || 'Monsoon 2026');
  const semesters = Object.keys(allSchedules);
  const currentClasses = allSchedules[activeSemester] || [];

  useEffect(() => localStorage.setItem('aio-schedules', JSON.stringify(allSchedules)), [allSchedules]);
  useEffect(() => localStorage.setItem('aio-active-sem', activeSemester), [activeSemester]);

  // 4. Class Form State & Logic
  const [newClass, setNewClass] = useState({
    day: 'Monday', courseCode: '', courseName: '', section: '', startTime: '', endTime: '', building: '', room: ''
  });

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClass.courseName || !newClass.startTime || !newClass.endTime) return; 
    const classEntry = { id: Date.now(), ...newClass };
    setAllSchedules({ ...allSchedules, [activeSemester]: [...currentClasses, classEntry] });
    setNewClass({ ...newClass, courseCode: '', courseName: '', section: '', startTime: '', endTime: '', room: '' });
  };

  const handleDeleteClass = (id) => {
    setAllSchedules({ ...allSchedules, [activeSemester]: currentClasses.filter(c => c.id !== id) });
  };

  const handleSemesterChange = (e) => {
    const selected = e.target.value;
    if (selected === 'NEW') {
      const newSem = prompt("Enter new semester name (e.g., Winter 2027):");
      if (newSem && !allSchedules[newSem]) {
        setAllSchedules({ ...allSchedules, [newSem]: [] });
        setActiveSemester(newSem);
      }
    } else {
      setActiveSemester(selected);
    }
  };

  // 5. Sorting and Formatting System
  const [viewFilter, setViewFilter] = useState('Today'); 
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayValues = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
  
  const [activeGridDay, setActiveGridDay] = useState(weekDays.includes(currentDayStr) ? currentDayStr : 'Monday');

  const sortedClasses = [...currentClasses].sort((a, b) => {
    if (dayValues[a.day] !== dayValues[b.day]) return dayValues[a.day] - dayValues[b.day];
    return a.startTime.localeCompare(b.startTime); 
  });
  const displayedClasses = viewFilter === 'Today' ? sortedClasses.filter(c => c.day === currentDayStr) : sortedClasses;

  const getClassStatus = (lecture) => {
    if (lecture.day !== currentDayStr) return 'upcoming'; 
    if (current24HourTime >= lecture.startTime && current24HourTime <= lecture.endTime) return 'ongoing';
    if (current24HourTime > lecture.endTime) return 'past';
    return 'upcoming';
  };

  const format12Hour = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${m} ${suffix}`;
  };

  // 6. Task List Engine
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('aio-tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', due: '', time: '', location: '', type: 'Assignment' });

  useEffect(() => localStorage.setItem('aio-tasks', JSON.stringify(tasks)), [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    setTasks([...tasks, { id: Date.now(), ...newTask, completed: false }]);
    setNewTask({ title: '', due: '', time: '', location: '', type: 'Assignment' });
    setShowTaskForm(false);
  };

  const handleDeleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));
  const toggleTaskCompletion = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  // 7. Grid Math Engine
  const startHour = 8; 
  const endHour = 20;  
  const totalMinutes = (endHour - startHour) * 60;
  const hoursArray = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const getEventStyle = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const topMinutes = (startH - startHour) * 60 + startM;
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return {
      top: `${(topMinutes / totalMinutes) * 100}%`,
      height: `${(durationMinutes / totalMinutes) * 100}%`
    };
  };

  const eventColors = [
    'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600',
    'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-600',
    'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-600',
    'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600',
    'bg-pink-100 border-pink-500 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-600',
    'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600',
  ];

  const getEventColor = (courseCode) => {
    if (!courseCode) return eventColors[0];
    const sum = courseCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return eventColors[sum % eventColors.length];
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-[#0a0a0c] text-gray-800 dark:text-gray-200 font-sans p-4 md:p-8 overflow-hidden flex flex-col">
      
      {/* Header */}
      <header className="mb-6 flex flex-col xl:flex-row justify-between xl:items-center gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-red-500 dark:to-purple-600">
              AIO Calendar
            </h1>
            <select value={activeSemester} onChange={handleSemesterChange} className="text-sm bg-gray-200 dark:bg-[#1a1a20] text-gray-700 dark:text-gray-300 rounded-md px-3 py-1.5 outline-none font-medium border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500 cursor-pointer shadow-sm">
              {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
              <option value="NEW">+ Create New Semester</option>
            </select>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your Schedule & Tasks</p>
        </div>
        
        <div className="flex bg-gray-200 dark:bg-[#1a1a20] p-1 rounded-lg border border-gray-300 dark:border-gray-800 w-fit">
          <button onClick={() => setActiveView('list')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${activeView === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
            📋 List View
          </button>
          <button onClick={() => setActiveView('calendar')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${activeView === 'calendar' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
            📅 Calendar Grid
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1a1a20] px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{currentDayStr}</span>
            <span className="text-lg font-bold text-blue-600 dark:text-red-500 tracking-wider">{current24HourTime}</span>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 px-4 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors shadow-inner font-medium cursor-pointer flex-shrink-0">
            {isDarkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </header>

      {/* LIST VIEW */}
      {activeView === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300 pb-8 flex-1 overflow-y-auto pr-2">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#121215] rounded-xl shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.15)] p-6 border border-gray-100 dark:border-red-900/30">
              <h2 className="text-xl font-semibold mb-4 dark:text-red-400">Add a Class</h2>
              <form onSubmit={handleAddClass} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <select value={newClass.day} onChange={(e) => setNewClass({...newClass, day: e.target.value})} className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a20] text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-red-500 outline-none">
                  {Object.keys(dayValues).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="text" placeholder="Code (e.g. ENR211)" value={newClass.courseCode} onChange={(e) => setNewClass({...newClass, courseCode: e.target.value})} className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a20] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-red-500 outline-none" />
                <input type="text" placeholder="Course Name" value={newClass.courseName} onChange={(e) => setNewClass({...newClass, courseName: e.target.value})} className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a20] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 lg:col-span-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-red-500 outline-none" />
                
                <input type="text" placeholder="Section (e.g. 2)" value={newClass.section} onChange={(e) => setNewClass({...newClass, section: e.target.value})} className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a20] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-red-500 outline-none" />
                
                {/* UPDATED TIME INPUTS WITH LABELS */}
                <div className="flex items-center bg-gray-50 dark:bg-[#1a1a20] border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-red-500">
                  <span className="text-xs text-gray-500 font-medium mr-2 whitespace-nowrap">Start:</span>
                  <input type="time" required value={newClass.startTime} onChange={(e) => setNewClass({...newClass, startTime: e.target.value})} className="bg-transparent w-full outline-none text-gray-900 dark:text-gray-200 dark:[color-scheme:dark] cursor-pointer" />
                </div>
                <div className="flex items-center bg-gray-50 dark:bg-[#1a1a20] border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-red-500">
                  <span className="text-xs text-gray-500 font-medium mr-2 whitespace-nowrap">End:</span>
                  <input type="time" required value={newClass.endTime} onChange={(e) => setNewClass({...newClass, endTime: e.target.value})} className="bg-transparent w-full outline-none text-gray-900 dark:text-gray-200 dark:[color-scheme:dark] cursor-pointer" />
                </div>

                <input type="text" placeholder="Building (e.g. GICT)" value={newClass.building} onChange={(e) => setNewClass({...newClass, building: e.target.value})} className="p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a20] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-red-500 outline-none" />
                
                <div className="flex gap-2 lg:col-span-4">
                  <input type="text" placeholder="Classroom (e.g. 236)" value={newClass.room} onChange={(e) => setNewClass({...newClass, room: e.target.value})} className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a20] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-red-500 outline-none" />
                  <button type="submit" className="bg-blue-600 dark:bg-red-600 hover:bg-blue-700 dark:hover:bg-red-700 text-white px-8 rounded-md font-bold transition-colors cursor-pointer shadow-md">+ Add</button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-[#121215] rounded-xl shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.15)] p-6 border border-gray-100 dark:border-red-900/30">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-red-400">Timetable: {activeSemester}</h2>
                <div className="flex bg-gray-100 dark:bg-[#1a1a20] rounded-lg p-1 border border-gray-200 dark:border-gray-800">
                  <button onClick={() => setViewFilter('Today')} className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${viewFilter === 'Today' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Today</button>
                  <button onClick={() => setViewFilter('All')} className={`px-4 py-1 rounded-md text-sm font-bold transition-colors ${viewFilter === 'All' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>All Week</button>
                </div>
              </div>
              
              <div className="space-y-4">
                {displayedClasses.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 italic">No classes scheduled for {viewFilter === 'Today' ? 'today' : 'this week'}.</p>
                ) : (
                  displayedClasses.map((lecture) => {
                    const status = getClassStatus(lecture);
                    let containerStyles = "p-5 rounded-lg border transition-all duration-300 group flex flex-col sm:flex-row sm:justify-between ";
                    if (status === 'past') containerStyles += "bg-gray-100 dark:bg-[#15151a] border-gray-100 dark:border-gray-800 opacity-60"; 
                    else if (status === 'ongoing') containerStyles += "bg-blue-50 dark:bg-[#1f1618] border-blue-300 dark:border-red-500/60 shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:shadow-[0_0_15px_rgba(239,68,68,0.2)]"; 
                    else containerStyles += "bg-white dark:bg-[#1a1a20] border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-red-500/50"; 

                    return (
                      <div key={lecture.id} className={containerStyles}>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          <div className="flex flex-col gap-2 relative">
                            {status === 'ongoing' && <span className="absolute -left-2 -top-2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 dark:bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 dark:bg-red-500"></span></span>}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border w-fit text-center ${status === 'ongoing' ? 'bg-blue-200 dark:bg-red-900/60 text-blue-800 dark:text-red-300 border-blue-300 dark:border-red-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-transparent'}`}>
                              {lecture.day}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                              {format12Hour(lecture.startTime)} - {format12Hour(lecture.endTime)}
                            </span>
                          </div>
                          
                          <div className="mt-2 sm:mt-0">
                            <h3 className={`font-bold text-lg transition-colors ${status === 'ongoing' ? 'text-blue-700 dark:text-red-400' : 'group-hover:text-blue-600 dark:group-hover:text-red-400'}`}>
                              {lecture.courseCode && <span className="mr-2">{lecture.courseCode}</span>}{lecture.courseName}
                            </h3>
                            {lecture.section && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Sec {lecture.section}</p>}
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3">
                          <div className={`px-4 py-2 rounded-md shadow-sm border text-sm font-medium text-right ${status === 'ongoing' ? 'bg-blue-100 dark:bg-red-950/40 border-blue-200 dark:border-red-900/50 text-blue-800 dark:text-red-300' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 dark:text-gray-300'}`}>
                            {lecture.building && <span>{lecture.building}</span>}{lecture.building && lecture.room && <br/>}{lecture.room && <span>Room {lecture.room}</span>}
                          </div>
                          <button onClick={() => handleDeleteClass(lecture.id)} className="text-gray-400 hover:text-red-600 font-bold px-2 py-1 transition-colors cursor-pointer text-sm" title="Delete class">✕</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121215] rounded-xl shadow-sm dark:shadow-[0_0_15px_rgba(168,85,247,0.1)] p-6 border border-gray-100 dark:border-purple-900/30 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold dark:text-purple-400">Upcoming Tasks</h2>
              <button onClick={() => setShowTaskForm(!showTaskForm)} className="text-xl text-blue-600 dark:text-purple-400 hover:text-blue-800 dark:hover:text-purple-300 font-bold px-3 py-1 bg-blue-50 dark:bg-purple-900/30 rounded-md transition-colors cursor-pointer">
                {showTaskForm ? '✕' : '+'}
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleAddTask} className="mb-6 p-4 bg-gray-50 dark:bg-[#1a1a20] rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                <input type="text" placeholder="Task or Event Title" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121215] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                <div className="flex gap-2">
                  <input type="text" placeholder="Date (e.g. 25 Aug)" value={newTask.due} onChange={(e) => setNewTask({...newTask, due: e.target.value})} className="w-1/2 p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121215] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                  <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})} className="w-1/2 p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121215] text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm">
                    <option value="Assignment">Assignment</option><option value="Quiz">Quiz</option><option value="Exam">Exam</option><option value="Project">Project</option><option value="Event">Event</option><option value="Workshop">Workshop</option><option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input type="time" value={newTask.time} onChange={(e) => setNewTask({...newTask, time: e.target.value})} className="w-1/2 p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121215] text-gray-900 dark:text-gray-200 dark:[color-scheme:dark] focus:ring-2 focus:ring-purple-500 outline-none text-sm cursor-pointer" />
                  <input type="text" placeholder="Location (Optional)" value={newTask.location} onChange={(e) => setNewTask({...newTask, location: e.target.value})} className="w-1/2 p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121215] text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                </div>
                <button type="submit" className="w-full bg-blue-600 dark:bg-purple-600 hover:bg-blue-700 dark:hover:bg-purple-700 text-white py-2 rounded-md font-bold transition-colors cursor-pointer text-sm">Save Task</button>
              </form>
            )}

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic text-sm text-center py-4">No pending tasks. You're all caught up!</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className={`p-4 border-l-4 rounded-r-lg shadow-sm transition-all flex justify-between items-start group ${task.completed ? 'border-gray-300 bg-gray-50 dark:bg-[#1a1a20] dark:border-gray-600 opacity-60' : 'border-blue-500 dark:border-purple-600 bg-white dark:bg-[#1a1a20]'}`}>
                    <div className="flex items-start gap-3 w-full">
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTaskCompletion(task.id)} className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0" />
                      <div className="w-full">
                        <h3 className={`font-semibold text-md ${task.completed ? 'text-gray-500 line-through dark:text-gray-400' : 'dark:text-gray-200'}`}>{task.title}</h3>
                        <div className="flex flex-wrap gap-2 items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {task.due && <span className="flex items-center gap-1">📅 {task.due}</span>}
                          {task.time && <span className="flex items-center gap-1">⏰ {format12Hour(task.time)}</span>}
                          {task.location && <span className="flex items-center gap-1">📍 {task.location}</span>}
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-transparent dark:border-gray-700 ml-auto font-medium">{task.type}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity cursor-pointer p-1 ml-2 flex-shrink-0">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* CALENDAR GRID VIEW */}
      {activeView === 'calendar' && (
        <div className="bg-white dark:bg-[#121215] rounded-xl shadow-sm dark:shadow-[0_0_15px_rgba(239,68,68,0.15)] border border-gray-100 dark:border-red-900/30 flex-1 flex flex-col animate-in fade-in duration-300 overflow-hidden">
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-[#1a1a20] rounded-t-xl shrink-0">
             <h2 className="text-xl font-bold dark:text-red-400">Weekly Grid</h2>
             <span className="text-sm bg-blue-100 dark:bg-purple-900/40 text-blue-700 dark:text-purple-400 px-3 py-1 rounded-full font-bold border border-transparent dark:border-purple-700/50">
                {activeSemester}
             </span>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-full lg:min-w-[800px] w-full relative pb-4">
              
              {/* Header Row - DESKTOP (6 Columns) */}
              <div className="hidden lg:flex border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-[#121215] z-20 shadow-sm">
                  <div className="w-16 shrink-0 bg-gray-50 dark:bg-[#1a1a20]"></div> 
                  {weekDays.map(day => (
                      <div key={day} className={`flex-1 text-center py-3 font-bold text-sm border-l border-gray-200 dark:border-gray-800 ${day === currentDayStr ? 'text-blue-600 dark:text-red-400 bg-blue-50/50 dark:bg-red-900/10' : 'text-gray-700 dark:text-gray-300'}`}>
                          {day.substring(0,3).toUpperCase()}
                      </div>
                  ))}
              </div>

              {/* Header Row - MOBILE (Interactive Dropdown showing Full Day Name) */}
              <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-[#121215] z-20 shadow-sm">
                  <div className="w-12 sm:w-16 shrink-0 bg-gray-50 dark:bg-[#1a1a20]"></div> 
                  <div className="flex-1 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a20]">
                      <select 
                          value={activeGridDay}
                          onChange={(e) => setActiveGridDay(e.target.value)}
                          className="w-full text-center py-3 font-bold text-sm bg-transparent outline-none text-blue-600 dark:text-red-400 appearance-none cursor-pointer"
                          style={{ textAlignLast: 'center' }}
                      >
                          {weekDays.map(day => (
                              <option key={day} value={day} className="text-gray-900 dark:text-gray-200 bg-white dark:bg-[#121215]">
                                  {day} ▾
                              </option>
                          ))}
                      </select>
                  </div>
              </div>


              {/* Grid Body */}
              <div className="flex relative" style={{ height: '800px' }}>
                  
                  {/* Time Labels (Y-axis) */}
                  <div className="w-12 sm:w-16 shrink-0 flex flex-col relative border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a20]">
                      {hoursArray.map(hour => (
                          <div key={hour} className="absolute w-full text-right pr-2 sm:pr-3 text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500"
                               style={{ top: `${((hour - startHour) / (endHour - startHour)) * 100}%`, transform: 'translateY(-50%)' }}>
                              {format12Hour(`${hour.toString().padStart(2, '0')}:00`)}
                          </div>
                      ))}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map(day => (
                      <div key={day} className={`flex-1 relative border-l border-gray-200 dark:border-gray-800 
                          ${activeGridDay === day ? 'block' : 'hidden lg:block'} 
                          ${day === currentDayStr ? 'bg-blue-50/30 dark:bg-red-900/5' : ''}`}>
                          
                          {/* Horizontal Grid Lines */}
                          {hoursArray.map(hour => (
                              <div key={hour} className="absolute w-full border-t border-gray-100 dark:border-gray-800/60 pointer-events-none"
                                   style={{ top: `${((hour - startHour) / (endHour - startHour)) * 100}%` }}></div>
                          ))}

                          {/* Events for this day */}
                          {currentClasses.filter(c => c.day === day).map((lecture) => {
                              const style = getEventStyle(lecture.startTime, lecture.endTime);
                              const colorClass = getEventColor(lecture.courseCode); 
                              
                              return (
                                  <div key={lecture.id}
                                       className={`absolute w-[92%] left-[4%] rounded-md border-l-4 p-2 text-xs overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-transform z-10 cursor-pointer ${colorClass}`}
                                       style={style}>
                                      <div className="font-extrabold truncate text-[11px] uppercase tracking-wider">{lecture.courseCode}</div>
                                      <div className="truncate font-bold opacity-90">{lecture.courseName}</div>
                                      <div className="opacity-75 mt-1 font-medium text-[10px] sm:text-xs">{format12Hour(lecture.startTime)} - {format12Hour(lecture.endTime)}</div>
                                      {lecture.room && <div className="opacity-75 font-medium truncate mt-0.5 text-[10px] sm:text-xs">Room {lecture.room}</div>}
                                  </div>
                              );
                          })}
                      </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;