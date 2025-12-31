let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let records = [];

// 加载 modal.html
fetch('modal.html')
  .then(r => r.text())
  .then(t => document.body.insertAdjacentHTML('beforeend', t))
  .then(() => {
    initModal();
    initCalendar();
  });

// 初始化日历
function initCalendar() {
  loadRecords();
}

// ========================
// 加载记录 & 渲染日历
// ========================
function loadRecords() {
  fetch('/api/records')
    .then(r => r.json())
    .then(data => {
      records = data;
      renderCalendar();
      calcSummary();
    });
}

function renderCalendar() {
  const calendarEl = document.getElementById('calendar');
  const monthLabel = document.getElementById('monthLabel');
  calendarEl.innerHTML = '';

  const recordMap = {};
  records.forEach(r => recordMap[r.date] = r);

  monthLabel.innerText = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}`;

  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  weekDays.forEach(day => {
    const div = document.createElement('div');
    div.innerText = day;
    div.style.fontWeight = 'bold';
    div.style.textAlign = 'center';
    calendarEl.appendChild(div);
  });

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startWeekday = (firstDayOfMonth.getDay()+6)%7;
  for(let i=0;i<startWeekday;i++) calendarEl.appendChild(document.createElement('div'));

  const lastDay = new Date(currentYear,currentMonth+1,0).getDate();
  for(let d=1; d<=lastDay; d++){
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const record = recordMap[dateStr];
    const div = document.createElement('div');
    div.className='day';
    if(dateStr===new Date().toISOString().slice(0,10)) div.classList.add('today');
    if(record) div.classList.add('hasRecord');
    div.innerHTML = `<div class="date">${d}</div><div class="weight">${record?.morning_weight||''}</div>`;
    div.onclick = ()=>window.openModal(dateStr);
    calendarEl.appendChild(div);
  }
}

// 上下月切换
document.getElementById('prevMonth').onclick = ()=>{
  currentMonth--;
  if(currentMonth<0){ currentMonth=11; currentYear--; }
  renderCalendar();
};
document.getElementById('nextMonth').onclick = ()=>{
  currentMonth++;
  if(currentMonth>11){ currentMonth=0; currentYear++; }
  renderCalendar();
};

// 统计
function calcSummary(){
  if(!records.length) return;
  const weights=records.map(r=>r.morning_weight).filter(w=>w);
  const foodSum = records.reduce((a,r)=>a+(Array.isArray(r.food_cal)?r.food_cal.reduce((s,n)=>s+n,0):r.food_cal||0),0);
  const exerciseSum = records.reduce((a,r)=>a+(Array.isArray(r.exercise_cal)?r.exercise_cal.reduce((s,n)=>s+n,0):r.exercise_cal||0),0);
  document.getElementById('weightRange').innerText=`${Math.max(...weights)} → ${Math.min(...weights)}`;
  document.getElementById('avgIn').innerText=Math.round(foodSum/records.length);
  document.getElementById('avgOut').innerText=Math.round(exerciseSum/records.length);
}

// ========================
// modal 初始化
// ========================
function initModal(){
  const modal=document.getElementById('modal');
  const morningWeight=document.getElementById('morningWeight');
  const nightWeight=document.getElementById('nightWeight');
  const foodList=document.getElementById('foodList');
  const exerciseList=document.getElementById('exerciseList');
  const foodTotalEl=document.getElementById('foodTotal');
  const exerciseTotalEl=document.getElementById('exerciseTotal');
  const period=document.getElementById('period');
  const diffEl=document.getElementById('diff');
  const modalDate=document.getElementById('modalDate');
  const addFood=document.getElementById('addFood');
  const addExercise=document.getElementById('addExercise');
  const saveBtn=document.getElementById('saveBtn');
  const closeBtn=document.getElementById('closeBtn');

  let foodItems=[], exerciseItems=[];

function addFoodItem(data={}) {
  const div = document.createElement('div');
  div.className = 'foodItem';
  div.innerHTML = `
    <input class="foodName" placeholder="吃了什么" value="${data.name || ''}">
    <input class="foodCal" placeholder="卡路里" type="number" value="${data.cal || ''}">
    <button type="button" class="delFood">删除</button>
  `;
  foodList.appendChild(div);
  div.querySelector('.delFood').onclick = () => { div.remove(); updateFoodTotal(); };
  div.querySelector('.foodCal').oninput = updateFoodTotal;
  div.querySelector('.foodName').oninput = updateFoodTotal;
  foodItems.push(div);
  updateFoodTotal();
}

function addExerciseItem(data={}) {
  const div = document.createElement('div');
  div.className = 'exerciseItem';
  div.innerHTML = `
    <input class="exerciseName" placeholder="运动" value="${data.name || ''}">
    <input class="exerciseCal" placeholder="消耗卡路里" type="number" value="${data.cal || ''}">
    <button type="button" class="delExercise">删除</button>
  `;
  exerciseList.appendChild(div);
  div.querySelector('.delExercise').onclick = () => { div.remove(); updateExerciseTotal(); };
  div.querySelector('.exerciseCal').oninput = updateExerciseTotal;
  div.querySelector('.exerciseName').oninput = updateExerciseTotal;
  exerciseItems.push(div);
  updateExerciseTotal();
}

// 加载已有记录时调用
const r = records.find(x => x.date === date);
if (r) {
  morningWeight.value = r.morning_weight || '';
  nightWeight.value = r.night_weight || '';
  period.checked = r.period === 1;

  if (Array.isArray(r.food)) {
    r.food.forEach((name,i) => addFoodItem({name:name, cal:r.food_cal[i] || 0}));
  } else if (r.food) {
    addFoodItem({name:r.food, cal:r.food_cal || 0});
  } else {
    addFoodItem();
  }

  if (Array.isArray(r.exercise)) {
    r.exercise.forEach((name,i) => addExerciseItem({name:name, cal:r.exercise_cal[i] || 0}));
  } else if (r.exercise) {
    addExerciseItem({name:r.exercise, cal:r.exercise_cal || 0});
  } else {
    addExerciseItem();
  }

} else {
  addFoodItem();
  addExerciseItem();
}

  function updateFoodTotal(){ let total=0; document.querySelectorAll('.foodCal').forEach(inp=>total+=parseInt(inp.value)||0); foodTotalEl.innerText=total; updateDiff();}
  function updateExerciseTotal(){ let total=0; document.querySelectorAll('.exerciseCal').forEach(inp=>total+=parseInt(inp.value)||0); exerciseTotalEl.innerText=total; updateDiff();}
  function updateDiff(){ diffEl.innerText=(parseInt(foodTotalEl.innerText)||0)-(parseInt(exerciseTotalEl.innerText)||0);}

  function openModal(date){
    currentDate=date; modal.classList.remove('hidden'); modalDate.innerText=date;
    morningWeight.value=''; nightWeight.value=''; foodList.innerHTML=''; exerciseList.innerHTML=''; foodItems=[]; exerciseItems=[]; period.checked=false;

    const r=records.find(x=>x.date===date);
    if(r){
      morningWeight.value=r.morning_weight||'';
      nightWeight.value=r.night_weight||'';
      period.checked=r.period===1;

      if(r.food && r.food_cal){ 
        const foods=Array.isArray(r.food)?r.food:[r.food];
        const cals=Array.isArray(r.food_cal)?r.food_cal:[r.food_cal];
        for(let i=0;i<foods.length;i++) addFoodItem({name:foods[i],cal:cals[i]});
      } else addFoodItem();

      if(r.exercise && r.exercise_cal){ 
        const exs=Array.isArray(r.exercise)?r.exercise:[r.exercise];
        const cals=Array.isArray(r.exercise_cal)?r.exercise_cal:[r.exercise_cal];
        for(let i=0;i<exs.length;i++) addExerciseItem({name:exs[i],cal:cals[i]});
      } else addExerciseItem();
    } else { addFoodItem(); addExerciseItem(); }
    updateFoodTotal(); updateExerciseTotal();
  }

  function closeModal(){ modal.classList.add('hidden'); }

  saveBtn.onclick=()=>{
    const foods=[], foodCals=[]; document.querySelectorAll('.foodItem').forEach(f=>{ foods.push(f.querySelector('.foodName').value); foodCals.push(parseInt(f.querySelector('.foodCal').value)||0);});
    const exercises=[], exerciseCals=[]; document.querySelectorAll('.exerciseItem').forEach(e=>{ exercises.push(e.querySelector('.exerciseName').value); exerciseCals.push(parseInt(e.querySelector('.exerciseCal').value)||0);});
    fetch('/api/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:currentDate,morning_weight:morningWeight.value,night_weight:nightWeight.value,food:foods,food_cal:foodCals,exercise:exercises,exercise_cal:exerciseCals,period:period.checked?1:0})})
    .then(()=>{ closeModal(); loadRecords(); });
  };

  closeBtn.onclick=closeModal; addFood.onclick=()=>addFoodItem(); addExercise.onclick=()=>addExerciseItem();
  window.openModal=openModal;
}
