function gobang() {
	const EMPTY = 0;
	const WHITE = 1;
	const BLACK = 2;
	const EQUAL = 3;
	const DIMENSION = 14;

	/* 
	* 存储全局信息
	*/
	let register = {
		isFinish: false,
		freePositions: (DIMENSION + 1) ** 2,
		whiteChess: new Image(),
		blackChess: new Image()
	};
	register.whiteChess.src = 'images/white-chess.png';
	register.blackChess.src = 'images/black-chess.png';

	/* 
	* 绘制棋盘
	*/
	function draw_chessboard(canvasEle, context) {
		let width_canvasEle = canvasEle.offsetWidth;
		// 预留内边距用于放置棋盘边缘的棋子
		let padding = width_canvasEle * 0.06;
		let offset = padding / 2;
		let width_inner = width_canvasEle - padding;
		let width_cell = width_inner / DIMENSION;
		register.cellWidth = width_cell;
		register.offset = offset;
		// 设置canvas的width和height特性解决奇怪的bug
		canvas.setAttribute('width', width_canvasEle);
		canvas.setAttribute('height', width_canvasEle);
		// 绘制棋盘单元格
		context.beginPath();
		context.translate(offset, offset);
		for(let i = 0; i <= DIMENSION; i++) {
			context.moveTo(0, i * width_cell);
			context.lineTo(width_inner, i * width_cell);
			context.moveTo(i * width_cell, 0);
			context.lineTo(i * width_cell, width_inner);
		}
		context.stroke();
		context.closePath();
	}

	/* 
	* 事件绑定
	*/
	function bind_events(canvasEle) {
		let control_btn = $('#control-btn');
		let signalEle = register.signalEle;
		control_btn.on('touchend, click', function btn_click_handler(event) {
			let button = this;
			let action = button.dataset.action;
			if (action == 'start') {
				let canvas = $(canvasEle);
				let signal = $(signalEle);
				canvas.on('mousemove', show_signal);
				canvas.on('touchend, click', drop_chess);
				signal.on('click', drop_chess);
				button.dataset.action = 'restart';
				button.innerHTML = '重新开局';
				register.walker = Math.random() < 0.5 ? WHITE : BLACK;
				let eleId = register.walker == WHITE ? '#dir-left' : '#dir-right';
				$(eleId).addClass('dir-icon-active');
			} else if (action == 'restart') {
				if (!register.isFinish) {
					if (confirm('还未分出胜败，确定重新开局?')) {
						location.reload();
					}
				} else {
					location.reload();
				}
			}
		});
	}

	/* 
	* 将棋盘上的落子点(线条交点)的坐标，行号，列号，以及初始状态映射至二维数组
	*/
	function map_chessboard(canvasEle) {
		let positions = [];
		let offset = register.offset;
		let width_cell = register.cellWidth;
		let offset_x = canvasEle.offsetLeft + offset, offset_y = canvasEle.offsetTop + offset;
		for (let row = 0; row <= DIMENSION; row++) {
			positions[row] = [];
			for (let col = 0; col <= DIMENSION; col++) {
				positions[row][col] = {
					coordinate: {
						x: offset_x + col * width_cell,
						y: offset_y + row * width_cell,
						row: row,
						col: col
					},
					state: {
						chessColor: EMPTY
					}
				};
			}
		}
		register.positions = positions;
	}

	/* 
	* 探测鼠标所在区域的状态
	* 可以落子，返回true, 否则返回false
	*/
	function detect(event) {
		event = event ? event : window.event;
		let mouse_x = event.clientX;
		let mouse_y = event.clientY;
		let range = register.cellWidth / 2;    // 落子点区域边长
		for (let row = 0; row <= DIMENSION; row++) {
			for (let col = 0; col <= DIMENSION; col++) {
				let currentPos = register.positions[row][col];
				let coordinate = currentPos.coordinate;
				let state = currentPos.state;
				let x = coordinate.x;
				let y = coordinate.y;
				if (mouse_x >= (x - range) && mouse_x <= (x + range) && mouse_y >= (y - range) && mouse_y <= (y + range)) {
					register.currentPos = currentPos;
					if (state.chessColor === EMPTY) {
						return true;
					} else {
						return false;
					}
				}
			}
		}
	}

	/* 
	* 显示可落子提示标志
	*/
	function show_signal(event) {
		let isEmpty = detect(event);
		let signalEle = register.signalEle;
		let canvasEle = register.canvasEle;
		if (isEmpty) {
			let currentPos = register.currentPos;
			signalEle.style.left = `${currentPos.coordinate.x}px`;
			signalEle.style.top = `${currentPos.coordinate.y}px`;
			signalEle.style.display = 'block';
			canvasEle.style.cursor = 'pointer';
		} else {
			signalEle.style.display = 'none';
			canvasEle.style.cursor = 'auto';
		}
	}

	/* 
	* 落子操作
	*/
	function drop_chess(event) {
		let currentPos = register.currentPos;
		if (currentPos.state.chessColor === EMPTY) {
			let walker = register.walker;
			let canvasEle = register.canvasEle;
			let context = register.context;
			let offset = register.offset;
			let width_cell = register.cellWidth;
			// 确定棋盘中准确的落子点坐标
			let dist_x = currentPos.coordinate.x - canvasEle.offsetLeft - offset - width_cell / 3;
			let dist_y = currentPos.coordinate.y - canvasEle.offsetTop - offset- width_cell / 3;
			// 将棋子的尺寸设置为棋盘单元格的2/3
			let dist_w = width_cell * (2 / 3);
			let dist_h = width_cell * (2 / 3);
			// 标志当前落子点已经被占用
			currentPos.state.chessColor = walker;
			register.freePositions -= 1;
			register.signalEle.style.display = 'none';
			// 绘制对应颜色的黑白棋子
			if (walker == WHITE) {
				register.walker = BLACK;
				context.drawImage(register.whiteChess, dist_x, dist_y, dist_w, dist_h);
			} else if (walker == BLACK) {
				register.walker = WHITE;
				context.drawImage(register.blackChess, dist_x, dist_y, dist_w, dist_h);
			}
			$('.dir-icon').toggleClass('dir-icon-active');
			// 每落子一次，判断一次输赢(胜负已分或平局)
			let ret = judge(currentPos.coordinate.row, currentPos.coordinate.col, walker);
			if (register.isFinish) {
				if (ret.winner === EQUAL) {
					// 平局
					alert('势均力敌，不分胜负!');
				} else {
					// 分出胜负，画出红色的五子连线
					let start_x = ret.start.coordinate.x - canvasEle.offsetLeft - offset;
					let start_y = ret.start.coordinate.y - canvasEle.offsetTop - offset;
					let end_x = ret.end.coordinate.x - canvasEle.offsetLeft - offset;
					let end_y = ret.end.coordinate.y - canvasEle.offsetTop - offset;
					context.beginPath();
					context.moveTo(start_x, start_y);
					context.lineTo(end_x, end_y);
					context.strokeStyle = '#f00';
					context.lineWidth = 2;
					context.stroke();
					context.closePath();
				}
				clear_events();
			}
		}
	}

	// 输赢判断
	function judge(row, col, walker) {
		let positions = register.positions;
		// 水平方向判断
		for (let i = 0; i < 5; i++) {
			let cursor = col - i;
			if (positions[row][cursor] === undefined || positions[row][col].state.chessColor !== walker) {
				break;
			}
			for (let j = 1; j < 5; j++) {
				if (positions[row][cursor + j] === undefined) {
					break;
				} else if (positions[row][cursor + j].state.chessColor === walker) {
					if (j == 4) {
						register.isFinish = true;
						return {
							winner: walker,
							start: positions[row][cursor],
							end: positions[row][cursor + 4]
						};
					} 
				} else {
					break;
				}
			}
		}
		// 垂直方向判断
		for (let i = 0; i < 5; i++) {
			let cursor = row + i;
			if (positions[cursor][col] === undefined || positions[cursor][col].state.chessColor != walker) {
				break;
			}
			for (let j = 1; j < 5; j++) {
				if (positions[cursor - j] === undefined || positions[cursor - j][col] === undefined) {
					break;
				} else if (positions[cursor - j][col].state.chessColor === walker) {
					if (j == 4) {
						register.isFinish = true;
						return {
							winner: walker,
							start: positions[cursor][col],
							end: positions[cursor - 4][col] 
						};
					}
				} else {
					break;
				}
			}
		}
		// 正对角线方向判断
		for (let i = 0; i < 5; i++) {
			let cursor_x = row - i, cursor_y = col - i;
			if (positions[cursor_x] === undefined || positions[cursor_x][cursor_y] === undefined || positions[cursor_x][cursor_y].state.chessColor != walker) {
				break;
			}
			for (let j = 1; j < 5; j++) {
				if (positions[cursor_x + j] === undefined || positions[cursor_x + j][cursor_y + j] === undefined) {
					break;
				} else if (positions[cursor_x + j][cursor_y + j].state.chessColor === walker) {
					if (j == 4) {
						register.isFinish = true;
						return {
							winner: walker,
							start: positions[cursor_x][cursor_y],
							end: positions[cursor_x + 4][cursor_y + 4]
						}
					}
				} else {
					break;
				}
			}
		}
		// 反对角线方向判断
		for (let i = 0; i < 5; i++) {
			let cursor_x = row - i, cursor_y = col + i;
			if (positions[cursor_x] === undefined || positions[cursor_x][cursor_y] === undefined || positions[cursor_x][cursor_y].state.chessColor !== walker) {
				break;
			}
			for (let j = 1; j < 5; j++) {
				if (positions[cursor_x + j] === undefined || positions[cursor_x + j][cursor_y - j] === undefined) {
					break;
				} else if (positions[cursor_x + j][cursor_y - j].state.chessColor === walker) {
					if (j == 4) {
						register.isFinish = true;
						return {
							winner: walker,
							start: positions[cursor_x][cursor_y],
							end: positions[cursor_x + 4][cursor_y - 4]
						}
					}
				} else {
					break;
				}
			}
		}
		// 平局判断
		if (register.freePositions == 0) {
			register.isFinish = true;
			return {
				winner: EQUAL
			};
		}
	}

	// 事件清除
	function clear_events() {
		let canvas = $(register.canvasEle);
		let signal = $(register.signalEle);
		canvas.off('mousemove', show_signal);
		canvas.off('touchend, click', drop_chess);
		signal.off('click', drop_chess);
	}

	function init() {
		register.canvasEle = $('#canvas').get(0);
		register.signalEle = $('#signal').get(0);
		let canvasEle = register.canvasEle, context;
		if (canvasEle.getContext) {
			context = register.context = canvasEle.getContext('2d');
		} else {
			alert('Your browser is not able to use canvas!');
			return;
		}
		draw_chessboard(canvasEle, context);
		map_chessboard(canvasEle);
		bind_events(canvasEle);
	}

	return { init };
}