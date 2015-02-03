define(['datatables', 'dataTables-tableTools', 'DT_bootstrap', 'underscore', 'bootstrap3-editable'], function () {
    var _listUrl = '/script/data/gsdata.json', _tagUrl = '/script/data/gsdata.json';
    var _datatables = null;
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
                            return  '<span class="row-details row-details-close"></span>' + data;
                        },
                        'width' : '15%',
                        'targets': 1
                    },
                    {
                        'render': function (data, type, row) {
                            var tpl = [], dataArray = data.split(',');
                            tpl = _.map(dataArray, function (value, index, list) {
                                return '<h5 data-rowId="' + row[0] + '" class="tagContainer"><span class="tagLabel">' + value + '</span><button type="button" class="close tag-btn removeTag"></button></h5>';
                            })
                            return tpl.join('') + '<h5 data-rowId="' + row[0] + '" class="newTagContainer"><button class="tag-btn addNewTag"></button></h5>';
                        },
                        'width' : '15%',
                        'targets': -1
                    }
                ],
                'headerCallback' : function (thead, data, start, end, display) {
                    $(thead).find('th').eq(0).css('width', '18px').html('<input type="checkbox" class="group-checkable" id="groupCheckbox"/>');
                }
            });
        _datatables = $('table', $mainZone).dataTable(dtConfig);
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
            // var selectedId = $this.closest('tr').find('.checkboxes').val();
            var selectedId = $this.closest('h5').attr('data-rowId');
			if ($this.hasClass('removeTag')) {
				var selectedTag = $this.prev().html();
                $.ajax({
                    type: 'get', //'post',
                    url: _tagUrl,
                    data: {
                        'rowKeySeq' : selectedId,
                        'tag' : selectedTag
                    },
                    dataType: 'json', //The json must be standard json object with double quotation marks
                    success: function (data) {
                        $this.closest('.tagContainer').remove();
                    }
                });
			} else if ($this.hasClass('addNewTag')) {
				$this.editable({
                    // placement: 'left',
					onblur : 'submit',
					showbuttons : false,
					toggle : 'manual',
					highlight : false,
					emptytext : '',
                    display: false,
					url : function (params) {
                        var data = {
                            'rowKeySeq' : selectedId,
                            'newTag' : params.value
                        };
                        $.ajax({
                            type: 'get', //'post',
                            url: _tagUrl,
                            data: data,
                            dataType: 'json', //The json must be standard json object with double quotation marks
                            success: function (data) {
                                // if (data.result === 'Success') {
                                   var tpl = '<h5 data-rowId="' + selectedId + '" class="tagContainer"><span class="tagLabel">' + params.value + '</span><button type="button" class="close tag-btn removeTag"></button></h5>';
                                    $this.closest('.newTagContainer').before(tpl); 
                                // }
                            }
                        });
					}
				}).editable('setValue', '').editable('toggle');
			}
        });
        
        
        /* Formatting function for row details */
        function _fnFormatDetails(oTable, nTr) {
            var aData = oTable.fnGetData(nTr);
            var sOut = '<table>';
            sOut += '<tr><td>Platform(s):</td><td>'+aData[2]+'</td></tr>';
            sOut += '<tr><td>Engine version:</td><td>'+aData[3]+'</td></tr>';
            sOut += '<tr><td>CSS grade:</td><td>'+aData[4]+'</td></tr>';
            sOut += '<tr><td>Others:</td><td>Could provide a link here</td></tr>';
            sOut += '</table>';
             
            return sOut;
        }
        
        //Add event listener for opening and closing details
        $('#mainZone').on('click', '#listContainer tbody tr td .row-details', function (e) {
            var nTr = $(this).closest('tr');
            if (_datatables.fnIsOpen(nTr)) {
                $(this).addClass("row-details-close").removeClass("row-details-open");
                _datatables.fnClose(nTr);
            } else {            
                $(this).addClass("row-details-open").removeClass("row-details-close");
                // _datatables.fnOpen( nTr, _fnFormatDetails(_datatables, nTr), 'details' );
                var rowData = _datatables.fnGetData(nTr);
                _datatables.fnOpen(nTr, rowData[1] + '--' + rowData[rowData.length - 1], 'info_row');
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
			var tagContent = $('#tagForm .tag-input').val();
            //solution1: Use dataTable Api to get all the selected checkbox.
            var nodes = $('#listContainer').DataTable().column(0).nodes();
            var rowKeySeq = [];
            $(':checked', nodes).each(function (index) {
                rowKeySeq.push($(this).val());
            });
            
            if (rowKeySeq.length > 0) {
                $.ajax({
                    type: 'get', //'post',
                    url: _tagUrl,
                    data: {
                        'newTag' : tagContent,
                        'rowKeySeq' : rowKeySeq.join(',')
                    },
                    dataType: 'json', //The json must be standard json object with double quotation marks
                    success: function (data) {
                        var successRows = rowKeySeq;//data.rows;
                        var tagNodes = $('#listContainer').DataTable().column(-1).nodes();
                        // var newTagContainers = $('.newTagContainer', tagNodes);
                        _.each(successRows, function (value, index, list) {
                            var tpl = '<h5 data-rowId="' + value + '" class="tagContainer"><span class="tagLabel">' + tagContent + '</span><button type="button" class="close tag-btn removeTag"></button></h5>';
                            $('.newTagContainer[data-rowId="' + value + '"]', tagNodes).before(tpl);
                        });
                    }
                });
            } else {
                console.log('Please select some rows when you want to tag.');
            }
		});
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