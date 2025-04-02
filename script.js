document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    const monthYearElement = document.getElementById('month-year');
    const calendarBody = document.getElementById('calendar-body');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');

    // 渲染日历
    function renderCalendar() {
        // 获取当前月份的第一天
        const firstDay = new Date(currentYear, currentMonth, 1);
        // 获取当前月份的最后一天
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        
        // 更新月份和年份显示
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        monthYearElement.textContent = `${currentYear}年 ${monthNames[currentMonth]}`;
        
        // 清空日历表格内容
        calendarBody.innerHTML = '';
        
        // 获取当前月份第一天是星期几（0表示星期日）
        let firstDayIndex = firstDay.getDay();
        
        // 获取上个月的最后一天
        const prevLastDay = new Date(currentYear, currentMonth, 0);
        // 返回该日期对象所代表的月份中的第几天
        const prevDaysCount = prevLastDay.getDate();
        
        // 计算日历表格需要的行数
        // 当前月份有几天
        const daysInMonth = lastDay.getDate();
        // 计算日历表格需要的行数
        const totalCells = Math.ceil((daysInMonth + firstDayIndex) / 7) * 7;
        
        let date = 1;
        let nextMonthDate = 1;
        
        // 创建日历表格的行和单元格
        // 这里的i表示行数
        for (let i = 0; i < totalCells / 7; i++) {
            // 创建新行
            const row = document.createElement('tr');
            
            // 创建行中的7个单元格（一周七天）
            // 这里的j表示一行中的7个单元格
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < firstDayIndex) {
                    // 上个月的日期
                    const prevDate = prevDaysCount - (firstDayIndex - j - 1);
                    cell.textContent = prevDate;
                    cell.classList.add('other-month');
                } else if (date > daysInMonth) {
                    // 下个月的日期
                    cell.textContent = nextMonthDate;
                    cell.classList.add('other-month');
                    nextMonthDate++;
                } else {
                    // 当前月份的日期
                    cell.textContent = date;
                    
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
            
            // 如果已经显示完当前月份的所有日期，而且已经填充了完整的一周，就不再添加新行
            if (date > daysInMonth && (i + 1) * 7 >= firstDayIndex + daysInMonth) {
                break;
            }
        }
    }

    // 前一个月按钮事件
    prevMonthButton.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    // 下一个月按钮事件
    nextMonthButton.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // 初始渲染
    renderCalendar();
});
