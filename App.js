Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
    items: [      // pre-define the general layout of the app; the skeleton (ie. header, content, footer)
      {
        xtype: 'container', // this container lets us control the layout of the pulldowns; they'll be added below
        itemId: 'pulldown-container',
        layout: {
                type: 'hbox',           // 'horizontal' layout
                align: 'stretch',
                padding: '5'
            }
      }
    ],
    
    
    EpicSelectorInit: false,    //hack to differentiate between nothing seleccted and --None-- selected
    StoryMapBoard: undefined,
    
    launch: function() {
        //Write app code here

        //API Docs: https://help.rallydev.com/apps/2.1/doc/
        console.log('Hello world! I am the decomp stry progress viewer in v0.1 change 2');
        
        me = this;
        me._loadIterations();
        console.log('iterations loaded');
        //me._loadData();


    },
    
     // create and load iteration pulldown 
    _loadIterations: function() {
        console.log('called _loadIterations');
      
        var me = this;

        var iterComboBox = Ext.create('Rally.ui.combobox.IterationComboBox', {
          itemId: 'iteration-combobox',     // we'll use this item ID later to get the users' selection
          fieldLabel: 'Start from:',
          labelAlign: 'right',
          width: 500,
          listeners: {
            ready: me._loadSchedules,      // initialization flow: next, load schedules
            select: me._loadData,           // user interactivity: when they choose a value, (re)load the data
            scope: me
           },
           storeConfig: {
            context: {
                    projectScopeDown: true
                }
            }
        });

        me.down('#pulldown-container').add(iterComboBox); 
        //me.add(iterComboBox); 
     },

    _loadSchedules: function(){
      console.log('called _loadSchedules');
      me = this;
      
     //me.add({
     me.down('#pulldown-container').add({
           xtype: 'rallyfieldvaluecombobox',
           itemId: 'state-combobox',
           
           model: 'UserStory',
           multiSelect: true,
           field: 'ScheduleState',
           value: ['Defined', 'Backlog', 'In-Progress', 'Completed'],
           
          fieldLabel: 'Schedule State',
          labelAlign: 'right',
           
           listeners: {
                select: me._loadData,
                ready: me._loadTags,
                //ready: me._loadEpics,
                scope: me
            }
        });
    },
    
    _loadTags: function(){
      console.log('called _loadTags'); 
      
      me = this;
      
       //me.add({
       me.down('#pulldown-container').add({
             xtype: 'rallytagpicker',
             itemId: 'tag-picker',
             width: 400,
             fieldLabel: 'Tags:',
             labelAlign: 'right',
             
             autoExpand: false,
             
             listeners: {
                  select: me._loadData,
                  selectionchange: me._loadData,
                  boxready: me._loadEpics,
                  scope: me
              }
          }); 
    },
    
    _loadEpics: function(){
      console.log('called _loadEpics');
      me = this;
      
     //me.add({
     me.down('#pulldown-container').add({
          xtype: 'rallyartifactsearchcombobox',
                  storeConfig: {
                      models: ['portfolioitem/epic']
                  },
           itemId: 'epic-combobox',
           //defaultSelectionPosition : 'first',
           allowClear : true,

          //value: '',
           
          fieldLabel: 'Epic drilldown:',
          labelAlign: 'right',
           
           listeners: {
                //select: me._loadData,
                select: me._selectEpicHelper,
                boxready: me._loadHideCheck,
                scope: me
            }
        });
     },
    
    _selectEpicHelper: function(){
      var me = this;
      me.EpicSelectorInit = true;
      me._loadData();      
    },
    
    _loadHideCheck: function(){
      console.log('called _loadHideCheck');
      var me = this;
     
      //me.add({
      me.down('#pulldown-container').add({
          xtype: 'rallycheckboxfield',
          boxLabel: 'Show empty iterations',
          itemId: 'hidecheckbox',
          value: true,
          width: 200,
          padding: '0 0 0 30',
           
           listeners: {
                change: me._loadData,
                //added: me._loadData,
                added: me._uiButtons,
                scope: me
            }
        });
    },
    
    _uiButtons: function(){
      var me = this;
      
      me.down('#pulldown-container').add({
        xtype: 'rallybutton',
        itemId: 'collapseallbutton',
        text: 'Collapse All',
        handler: function() {
            //Ext.Msg.alert('Button', 'You clicked collapse');
            me._doCollapse('collapse');
        },
        scope: me
      });   

      me.down('#pulldown-container').add({
        xtype: 'rallybutton',
        itemId: 'expandallbutton',
        text: 'Expand All',
        handler: function() {
            //Ext.Msg.alert('Button', 'You clicked expand');
            me._doCollapse('expand');
        },
        scope: me
      });  
      
      me._loadData();
    },
    
    _getFilters: function(states, iter, epic, tags){
      
        console.log('##############epic is', epic);
        
        var myFilters = undefined;
        myFilters = me._getStateFilter(states);
        myFilters = myFilters.and(me._getIterFilter(iter));
        if (epic != '') { myFilters = myFilters.and(me._getEpicFilter(epic)); }
        if (tags.length > 0) { myFilters = myFilters.and(me._getTagFilter(tags)); }
        myFilters = myFilters.and(me._getParentFilter());
        
        return myFilters;    
    },
    
    
    _getStateFilter: function(states){

      var output = undefined;
      var currFilter = undefined;
      
      // state filter
      states.forEach(function(state){
        currFilter = Ext.create('Rally.data.wsapi.Filter', {
          property: 'ScheduleState',
          operation: '=',
          value: state
        });
        if (output) {
            output = output.or(currFilter);
        }else {
            output = currFilter;
        }
      });
      return output;
    },
    
    
    
    _getIterFilter: function(iter){
      
       // iteration filter
      var iterDate  = me.down('#iteration-combobox').getRecord().data.StartDate.toISOString();
      
      var iterFilter1 = Ext.create('Rally.data.wsapi.Filter', {
        property: 'Iteration.StartDate',
        operator: '>=',
        value: iterDate
      });
      
      // don't exclude None iteration
      var iterFilter = iterFilter1.or(
          Ext.create('Rally.data.wsapi.Filter', {
            property: 'Iteration',
            operator: '=',
            value: null
          })
      );
      
      return iterFilter;  
    },
    
    
    
    
    _getEpicFilter: function(epic){
      
      //var epic  = me.down('#epic-combobox').getValue();
      console.log('epic Value is ', epic);
      if (epic != ''){
        console.log('shoudl be searching for ', epic);
        
        epicFilter = Ext.create('Rally.data.wsapi.Filter', {
          property: 'Epic',
          operator: '=',
          value: epic
        });
        
        /*var epicFilter = Ext.create('Rally.data.wsapi.Filter', {
          property: 'PortfolioItem',
          operator: '=',
          value: epic
        });
        
        epicFilter = epicFilter.or(Ext.create('Rally.data.wsapi.Filter', {
            property: 'Parent.PortfolioItem',
            operator: '=',
            value: epic
          }).and(Ext.create('Rally.data.wsapi.Filter', {
            property: 'Parent.c_Type',
            operator: '=',
            value: 'UserStory'}
          ))
        );*/

       console.log('epic filter is ', epicFilter);
       return epicFilter;
       
      }     
    },
    
    
    
    _getTagFilter: function(tags){
      
      
      var tagFilter = undefined;
         // tagfilter    
      console.log('tags is',tags);
      if (tags.length > 0){
        
        _.each(tags, function(tag) {
          
              if (!tagFilter){
                
                tagFilter = Ext.create('Rally.data.wsapi.Filter', {
                property: 'Tags',
                operator: '=',
                value: tag.data._ref});
                
              } else {
                
                tagFilter = tagFilter.or(Ext.create('Rally.data.wsapi.Filter', {
                property: 'Tags',
                operator: '=',
                value: tag.data._ref}));
              }
          });       
      } else {
          // throw exception?
      }
      return tagFilter;
    },
    
    _getParentFilter(){
      
      // exclude parent stories     
      return Ext.create('Rally.data.wsapi.Filter', {
        property: 'DirectChildrenCount',
        operator: '=',
        value: 0
      }); 
    },
    
    _hideEmptyColumns(){
      
      console.log('entering hide empty');
      var me = this;
      
      var cols = me.down('#progressboard').getColumns();
      
      var showEmpty  = me.down('#hidecheckbox').getValue();
      var firstIter = me.down('#iteration-combobox').getRecord().get('Name');
      var preFirstIter = true;

      _.each(cols, function(col) {
          var cardsInCol = col.getCards();
          var cardCount = _.flatten(_.values(cardsInCol)).length;
          
          
          if (col.getColumnHeaderConfig().headerTpl === firstIter){
              preFirstIter = false;
          }
          
          // always hide all columns before the selected iteration except None, as they will never have cards
          // if hide empty is on, also hide all columns after current iteration that have no cards
          
          if((preFirstIter && col.getColumnHeaderConfig().headerTpl != 'None') || (cardCount === 0 && !showEmpty)) {
            console.log('hiding', col, ' because ', 'before selected iter:', preFirstIter, 'the header is ', col.getColumnHeaderConfig().headerTpl , 'cardcount is ', cardCount, 'showempty is',showEmpty);
              col.setVisible(false);
          } else {
             col.setVisible(true);
          }
          
      });
      console.log('leaving hide empty');
    },
   
    _doCollapse(action){
      
      var rows = me.down('#progressboard').getRows();
              
      if (action == 'collapse'){
            me._collapseAll(rows);
      } else if (action == 'expand'){
            me._expandAll(rows);
      }      
    },
    
    _collapseAll(rows){
      var me = this;
      console.log('in collapse');
      _.each(rows, function(row) {
        //console.log('collapsing', row);
        row.collapse();
        //console.log('collapsed', row);
      });
    },
      
      
    _expandAll(rows){
      var me = this;
      console.log('in expand');
      _.each(rows, function(row) {
        //console.log('expanding', row);
        row.expand();
        //console.log('expanded', row);
      });
    },
      
      
    _onBoardLoaded: function(board, config){

      var me = this;   
      me._hideEmptyColumns();
      me._doCollapse('expand');       
    
    },
    
    _loadData: function(){
    
      me = this;     
      
      console.log(me.down('#tag-picker').selectedValues.items);
      
      //annoying thing, epic selector is null when loaded which filters to None epic. Override to '' which means no filter
      var epic  = me.EpicSelectorInit ? me.down('#epic-combobox').getValue() : '';
      
      var myFilters = me._getFilters(me.down('#state-combobox').getValue(), me.down('#iteration-combobox').getRecord().get('_ref'), epic, me.down('#tag-picker').selectedValues.items);
      

      var rowConf = 'Epic';
      var fieldList = ['Name','Parent','ScheduleState','PlanEstimate'];
      
      if (myFilters) {
        
        
        if (epic != '') {
          console.log('setting parent', epic);
          rowConf = 'Parent';
          fieldList = ['Name','ScheduleState','PlanEstimate'];
          console.log('shouldnt see parent in the card');
        }

        console.log('fieldlist is ',fieldList);
       
        if (me.StoryMapBoard) {

           me.StoryMapBoard.refresh({
                  storeConfig: {
                    filters: myFilters
                  },
                  rowConfig: {
                    field: rowConf
                  },
                  cardConfig: {
                    fields: fieldList
                  }
           });
          
        } else {
        
          me.StoryMapBoard = Ext.create('Rally.ui.cardboard.CardBoard',{
                //xtype: 'rallycardboard',
                types: ['User Story'],
                attribute: 'Iteration',
                itemId: 'progressboard',
                
                rowConfig: {
                    field: rowConf
                },
                cardConfig: {
                    fields: fieldList
                },
                
                /*columnHeaderConfig: {
                    headerTpl: "{name}<br/>{start_date} - {end_date}",
                    headerData: {
                                  name: record.get('Name'),
                                  start_date: start_date,
                                  end_date: end_date
                                }
                 },*/
                
                listeners: {
                              load: me._onBoardLoaded,
                              scope: me
                              },
                
                storeConfig: {
                    filters: myFilters,
                    context:{
                              /*
                              // MA squad
                              project:'/project/215859356248',
                              projectScopeUp: false,
                              projectScopeDown: true
                              */
                              // OTC program
                              //project:'/project/68036597828',
                              projectScopeUp: false,
                              projectScopeDown: true
                              
                            },
                }          

            });          
          me.add(me.StoryMapBoard);
        }
        console.log('board config is ',me.StoryMapBoard.getStoreConfig()); 
        console.log('context is ',this.getContext()); 

      } else {
          console.log('No states selected');
      }
         
    }    
// grouped card board====     
          
          
          
          
          
                
//to do:

// change column to iteration - done :)

// change row to parent hierarchy - done-ish - can have parent or Epic but  not  both. (Parent or PortfolioItem)

// indicate state - done :)

// add a scheduleState picker - done

// remove empty columns - done

// put "None" back - done

// refactor with a horiz layout - done

// sort out the loading sequence with the Epic picker - done

// add title - done

// add Epic selector -  select Epic shows parent stories, no Epic shows epic - done

// pull bottom level stories but group by epic - done

// add project selector - done (not needed when we use getcontext)

// add tag picker - done


// put date in the header as well

// get the program view working - load all iterations of child projects - done

// BUG? why do completed stories not count in cardcount sometimes? - doneish - need to  scroll to end to load

// indicate size and progress vs tasks
// navigate from current project only, up to epics, then select anything from other squads as well. Mark somehow. don't do, use top level and epic select
 

});


