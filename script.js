document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthYearElement = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    // 添加事件监听器
    prevMonthButton.addEventListener('click', showPreviousMonth);
    nextMonthButton.addEventListener('click', showNextMonth);

    // 显示上个月
    function showPreviousMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }

    // 显示下个月
    function showNextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }

    // 检查lunar库是否加载
    function isLunarLoaded() {
        return typeof Lunar !== 'undefined';
    }

    // 渲染日历
    function renderCalendar() {
        // 清空日历内容
        calendarBody.innerHTML = '';
        
        // 更新标题
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        monthYearElement.textContent = `${currentYear}年 ${monthNames[currentMonth]}`;
        
        // 获取当月第一天
        const firstDay = new Date(currentYear, currentMonth, 1);
        
        // 获取当月天数
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // 获取当月第一天是星期几
        const firstDayIndex = firstDay.getDay();
        
        // 获取上个月的天数
        const prevDaysCount = new Date(currentYear, currentMonth, 0).getDate();
        
        // 计算总单元格数量 (最多6行 * 7天)
        const totalCells = 42;
        
        // 初始日期计数器
        let date = 1;
        let nextMonthDate = 1;

        // 创建日历表格的行和单元格
        for (let i = 0; i < 6; i++) {
            // 创建新行
            const row = document.createElement('tr');
            
            // 创建行中的7个单元格（一周七天）
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < firstDayIndex) {
                    // 上个月的日期
                    const prevDate = prevDaysCount - (firstDayIndex - j - 1);
                    
                    // 使用div包装日期以便于添加样式
                    const dateContainer = document.createElement('div');
                    dateContainer.classList.add('date-container');
                    
                    const solarDate = document.createElement('div');
                    solarDate.textContent = prevDate;
                    solarDate.classList.add('solar-date');
                    
                    dateContainer.appendChild(solarDate);
                    
                    // 添加上个月的农历信息
                    try {
                        if (typeof Lunar !== 'undefined') {
                            // 计算上个月的年份和月份
                            let prevMonth = currentMonth - 1;
                            let prevYear = currentYear;
                            if (prevMonth < 0) {
                                prevMonth = 11;
                                prevYear--;
                            }
                            
                            const lunarDate = Lunar.fromDate(new Date(prevYear, prevMonth, prevDate));
                            const lunarElement = document.createElement('div');
                            lunarElement.textContent = lunarDate.getDayInChinese();
                            lunarElement.classList.add('lunar-date');
                            
                            dateContainer.appendChild(lunarElement);
                        }
                    } catch (e) {
                        console.error('上个月农历转换错误:', e);
                    }
                    
                    cell.appendChild(dateContainer);
                    cell.classList.add('other-month');
                } else if (date > daysInMonth) {
                    // 下个月的日期
                    const dateContainer = document.createElement('div');
                    dateContainer.classList.add('date-container');
                    
                    const solarDate = document.createElement('div');
                    solarDate.textContent = nextMonthDate;
                    solarDate.classList.add('solar-date');
                    
                    dateContainer.appendChild(solarDate);
                    
                    // 添加下个月的农历信息
                    try {
                        if (typeof Lunar !== 'undefined') {
                            // 计算下个月的年份和月份
                            let nextMonth = currentMonth + 1;
                            let nextYear = currentYear;
                            if (nextMonth > 11) {
                                nextMonth = 0;
                                nextYear++;
                            }
                            
                            const lunarDate = Lunar.fromDate(new Date(nextYear, nextMonth, nextMonthDate));
                            const lunarElement = document.createElement('div');
                            lunarElement.textContent = lunarDate.getDayInChinese();
                            lunarElement.classList.add('lunar-date');
                            
                            dateContainer.appendChild(lunarElement);
                        }
                    } catch (e) {
                        console.error('下个月农历转换错误:', e);
                    }
                    
                    cell.appendChild(dateContainer);
                    cell.classList.add('other-month');
                    
                    nextMonthDate++;
                } else {
                    // 当前月份的日期
                    const dateContainer = document.createElement('div');
                    dateContainer.classList.add('date-container');
                    
                    // 创建公历日期元素
                    const solarDate = document.createElement('div');
                    solarDate.textContent = date;
                    solarDate.classList.add('solar-date');
                    
                    // 添加到容器
                    dateContainer.appendChild(solarDate);
                    
                    try {
                        // 获取农历信息
                        if (typeof Lunar !== 'undefined') {
                            const lunarDate = Lunar.fromDate(new Date(currentYear, currentMonth, date));
                            
                            // 创建农历日期元素
                            const lunarElement = document.createElement('div');
                            lunarElement.textContent = lunarDate.getDayInChinese();
                            lunarElement.classList.add('lunar-date');
                            
                            // 添加到容器
                            dateContainer.appendChild(lunarElement);
                        }
                    } catch (e) {
                        console.error('农历转换错误:', e);
                    }
                    
                    cell.appendChild(dateContainer);
                    
                    // 标记今天的日期
                    if (date === currentDate.getDate() && 
                        currentMonth === currentDate.getMonth() && 
                        currentYear === currentDate.getFullYear()) {
                        cell.classList.add('today');
                    }
                    
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            calendarBody.appendChild(row);
            
            // 如果已经显示完当前月份的所有日期，就跳出循环
            if (date > daysInMonth) {
                break;
            }
        }
    }

    // 页面加载完成后渲染日历
    if (!isLunarLoaded()) {
        console.warn('农历库未加载，将只显示公历日期');
    }
    renderCalendar();

    // 添加简单的调试功能
    function showDebug(show) {
        const debugInfo = document.getElementById('debug-info');
        if (show) {
            debugInfo.style.display = 'block';
            let lunarInfo = '未加载';
            try {
                if (typeof Lunar !== 'undefined') {
                    const today = new Date();
                    const lunarDate = Lunar.fromDate(today);
                    lunarInfo = `已加载，今天的农历日期：${lunarDate.getYearInChinese()}年${lunarDate.getMonthInChinese()}月${lunarDate.getDayInChinese()}`;
                }
            } catch (e) {
                lunarInfo = `加载出错: ${e.message}`;
            }
            
            debugInfo.innerHTML = `
                <p>公历: ${currentYear}年${currentMonth + 1}月</p>
                <p>农历库状态: ${lunarInfo}</p>
                <button onclick="hideDebug()">关闭调试</button>
            `;
        } else {
            debugInfo.style.display = 'none';
        }
    }

    function hideDebug() {
        document.getElementById('debug-info').style.display = 'none';
    }

    // 添加键盘快捷键显示调试信息 (按D键)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'd' || e.key === 'D') {
            showDebug(true);
        }
    });
});
