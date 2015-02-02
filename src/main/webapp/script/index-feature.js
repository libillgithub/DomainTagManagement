define(['datatables', 'dataTables-tableTools', 'DT_bootstrap', 'underscore', 'bootstrap3-editable'], function () {
    var _listUrl = '/script/data/gsdata.json', _tagUrl = '/script/data/gsdata.json';
    var _datatablesCfg = {
        'searching' : false,
        'aLengthMenu': [10, 30, 50, 100, 200],
        'iDisplayLength': 10,
        'sPaginationType': 'bootstrap',
        'oLanguage': {
            'sProcessing': '正在加载中......',
            'sLengthMenu': '每页显示 _MENU_ 条记录',
            'sZeroRecords': '查询不到相关数据！',
            'sEmptyTable': '表中无数据存在！',
            'sInfo': '当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录',
            'sInfoEmpty': '当前显示 0 到 0 条，共 0 条记录',
            'sInfoFiltered': '（已从 _MAX_ 条总记录中过滤）',
            'sSearch': '搜索：',
            'oPaginate': {
                'sFirst': '首页',
                'sPrevious': '上一页',
                'sNext': '下一页',
                'sLast': '末页'
            }
        }
        ,'dom' : '<"row"f><"table-scrollable"rt><"row"<"col-md-2 col-sm-12"l><"col-md-3 col-sm-12"i><"col-md-7 col-sm-12"p>>'
    };
    
    function _renderSearchZone() {
        
        
    }
    
    function _renderTable(data) {
        var $mainZone = $('#mainZone').empty();
        $mainZone.append('<table id="listContainer" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered table-hover"></table>');
        
        var columns = _.map(data.columns || [], function (value, index, list) {return {'title' : value}}),
            dtConfig = $.extend({}, _datatablesCfg, {
                'data': data.rows || [],
                'columns': columns,
                'order': [ 1, 'asc' ],
                'columnDefs': [
                    {
                        'render': function (data, type, row) {
                            return '<input type="checkbox" class="checkboxes" value="' + data + '"/>';
                        },
                        'orderable': false,
                        'targets': 0
                    },
                    {
                        'render': function (data, type, row) {
                            var tpl = [], dataArray = data.split(',');
                            tpl = _.map(dataArray, function (value, index, list) {
                                return '<h5 class="tagContainer"><span class="tagLabel">' + value + '</span><button type="button" class="close tag-btn removeTag"></button></h5>';
                            })
                            return tpl.join('') + '<h5 class="newTagContainer"><button class="tag-btn addNewTag"></button></h5>';
                        },
                        'width' : '200px',
                        'targets': -1
                    }
                ],
                'headerCallback' : function (thead, data, start, end, display) {
                    $(thead).find('th').eq(0).css('width', '18px').html('<input type="checkbox" class="group-checkable" id="groupCheckbox"/>');
                }
            });
        $('table', $mainZone).dataTable(dtConfig);
    }
    
    function _renderMainZone(params) {
		params = params || {};
        $.ajax({
            url: _listUrl,
            data: params,
            dataType: 'json', //The json must be standard json object with double quotation marks
            success: function (data) {
                var domainData = []; // data.domainData;
                for (var i = 0; i < 20000; i++) {
                    domainData.push(['google.com' + i, 'google.com' + i, 'Spring框架agile敏捷软件开发', 'Spring框架', '在最近的一次网络研讨会上，Vanessa DiMaura针对爱德曼信任度调查报告( Edelman Trust Barometer)的诸多要点', 'Vanessa DiMaura针对爱德曼信任度调查报告( Edelman Trust Barometer)的诸多要点', 'Java,IT']);
                }
                data = {
                    rows : domainData,
                    columns : ['rowKey', 'domain', 'title', 'keywords', 'description', 'content', 'tag']
                }
                
                _renderTable(data);
            }
        });
    }
    
    function _registListener() {
        $('#mainZone').on('click', '.group-checkable', function (e) {
            var checked = $(this).is(':checked');
            $('#mainZone table tbody .checkboxes').attr('checked', checked);
        });
		
		$('#mainZone').on('click', '.tag-btn', function (e) {
			var $this = $(this);
			if ($this.hasClass('removeTag')) {
				var selectedTag = $this.prev().html();
				var selectedId = $this.closest('tr').find('.checkboxes').val();
				console.log('selectedTag + selectedId = ' + selectedTag + ' & ' + selectedId);
				$this.closest('.tagContainer').remove();
				
				//TODO: It need to send request.
			} else if ($this.hasClass('addNewTag')) {
				$this.editable({
					// mode : 'inline',
					onblur : 'submit',
					showbuttons : false,
					toggle : 'manual',
					highlight : false,
					emptytext : '',
					url : function (params) {
						// parentNode.css('display', 'none');
						targeNode.editable('destroy');
						// $.post('init-dataset', params, function (data) {
							// var date = new Date();
							// data = {id : date.getTime(), name : 'Dashboard' + params.value};
						// });
					}
				}).editable('toggle');
			}
        });
		
		$('#searchForm .toolZone-btn').on('click', function (e) {
			var searchParams = $('#searchForm').serializeArray();
			var params = {};
			_.each(searchParams, function (obj, index, list) {
				params[obj.name] = obj.value;
			});
			_renderMainZone(params);
		});
		
		$('#tagForm .toolZone-btn').on('click', function (e) {
			var tag = $('#tagForm .tag-input').val();
            //solution1: Use dataTable Api to get all the selected checkbox.
            var nodes = $('#listContainer').DataTable().column(0).nodes();
            var rowKeySeq = [];
            $(':checked', nodes).each(function (index) {
                rowKeySeq.push($(this).val());
            });
            
            if (rowKeySeq.length > 0) {
                $.ajax({
                    type: 'post',
                    url: _tagUrl,
                    data: {
                        'newTag' : tag,
                        'rowKeySeq' : rowKeySeq.join(',')
                    },
                    dataType: 'json', //The json must be standard json object with double quotation marks
                    success: function (data) {
                        console.log(data);
						//TODO: It need to update the selected row tag.
                    }
                });
            } else {
                console.log('Please select some rows when you want to tag.');
            }
		});
		
        /*
        //solution1: Use dataTable Api to get all the selected checkbox.
        var nodes = $('#listContainer').DataTable().column(0).nodes()
        $(':checked', nodes).each(function (index) {console.log($(this).text())})
        
        //solution2: Use dataTable Api to get all the selected checkbox.
        $('#listContainer').DataTable().column(0)
        .nodes()
        .each(function (value, index) {
        	console.log('Data in index: ' + index + ' is: ' + value.innerHTML);
        });
        */
    }
    
    function _main() {
        _renderSearchZone();
        _renderMainZone();
        _registListener();
    }
    
    return {
        'main' : _main
    };
});