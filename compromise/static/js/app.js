$(function() {

	//  ========
	//  = Help =
	//  ========

	function copyFix(arr) {
		return JSON.parse(JSON.stringify(arr));
	};

	

	//  ================
	//  = Answer model =
	//  ================
	var Answer = Backbone.Model.extend({
		defaults: {
			name: '',
			type: ''
		}
	});

	//  ======================
	//  = Answers collection =
	//  ======================
	var AnswersCollection = Backbone.Collection.extend({
	    model: Answer,
	    add_item: function(attr) {
	    	var self = this;
			attr.index = self.models.length;
			self.add(attr);
	    },
	    delete_item: function(index) {
	    	var self = this;
			var item = self.where({index: parseInt(index)});
			self.remove(item);
			self.forEach(function(model, index) {
				item = self.models[index];
				model.attributes.index = index;
				item.set(model.attributes);
			});
	    }
	});

	//  ================
	//  = User model =
	//  ================
	var User = Backbone.Model.extend({
		defaults: {
			mail: ''
		}
	});

	//  ======================
	//  = Users collection =
	//  ======================
	var UsersCollection = Backbone.Collection.extend({
	    model: User,
	    add_item: function(attr) {
	    	var self = this;
			attr.index = self.models.length;
			self.add(attr);
	    },
	    delete_item: function(index) {
	    	var self = this;
			var item = self.where({index: parseInt(index)});
			self.remove(item);
			self.forEach(function(model, index) {
				item = self.models[index];
				model.attributes.index = index;
				item.set(model.attributes);
			});
	    }
	});
	var users_collection = new UsersCollection();

	//  ==================
	//  = Question model =
	//  ==================
	var Question = Backbone.Model.extend({
		defaults: {
			name: '',
			type: '',
		},
		initialize: function() {
			var self = this;
			self.set({
				answers: new AnswersCollection(), 
				type: self.get('type')
			});
			// Bind answers
			self.get('answers').bind('add', questions_view.render_answers, questions_view);
			self.get('answers').bind('remove', questions_view.render_answers, questions_view);

		}
	});

	//  ========================
	//  = Questions collection =
	//  ========================
	var QuestionCollection = Backbone.Collection.extend({
	    model: Question,
	    add_item: function(attr) {
	    	var self = this;
			attr.index = self.models.length;
			self.add(attr);

	    },
	    delete_item: function(index) {
	    	var self = this;
			var item = self.where({index: parseInt(index)});
			self.remove(item);
			self.forEach(function(model, index) {
				item = self.models[index];
				model.attributes.index = index;
				item.set(model.attributes);
			});
	    }
	});
	
	var question_collection = new QuestionCollection();

	

	//  =================
	//  = Questions view =
	//  ==================

	var QuestionsView = Backbone.View.extend({
		el: $('#questions'),
		question_template: '',
		modal_template: '',
		name: '',
		type: '',
		events: {
			'click #question-add': 'add_question',
			'click #questions-list .delete': 'delete_question',
			'click .question .edit': 'show_modal',
			'click #modal .add-answer': 'add_answer',
			'click #modal .delete': 'delete_answer',
			'click #save-event': 'save_event',
			'click .users .add-user-select': 'add_user_select',
            'click .users .add-user-input': 'add_user_input',
			'click .users-list .delete': 'delete_user',
		},
		initialize: function() {
			var self = this;
			self.name = self.$el.find('#question-name');
			self.type = self.$el.find('#question-type');

			self.question_template = _.template($('#question-tr-tpl').html()); 
			self.answer_template = _.template($('#answer-tr-tpl').html()); 
			self.modal_template = _.template($('#modal-tpl').html());

			self.options.questions.bind('add', self.render_question, self);
			self.options.questions.bind('remove', self.render_question, self);

			self.options.users.bind('add', self.render_user, self);
			self.options.users.bind('remove', self.render_user, self);

		},
		add_question: function() {
			var self = this;
			var name = $(self.name).val();
			var type = $(self.type).val();
			if(name == '') return;
			self.options.questions.add_item({
				name: name, 
				type: type,
				min: 0,
				max: 100
			});

			
		},
		delete_question: function(e) {
			var self = this;
			var index = $(e.target).closest('tr').attr('data-index');
			self.options.questions.delete_item(index);
		},
		render_question: function(model, collection) {
			var self = this;

			self.$el.find('#questions-list tbody').html('');
			collection.forEach(function(model, index) {
				var icon_class ='';
				switch(model.get('type')) {
					case 'list':
						icon_class = 'list';
					break;
					case 'number':
						icon_class = 'icon-asterisk';
					break;
					case 'date_time':
						icon_class = 'date';
					break;
				}
				var el = self.question_template({
					index: index, 
					name: model.get('name'),
					icon_class: icon_class,
				});
				self.$el.find('#questions-list tbody').append(el);
			});
			
		},
		show_modal: function(e) {
			var self = this;
			var index = $(e.target).closest('tr').attr('data-index');
			var model = self.options.questions.where({index: parseInt(index)});
			model = model[0];
			$('#modal').html(self.modal_template({data: model.attributes}));
			self.render_answers(null, model.get('answers'));
			if(model.get('type') == 'date_time') {
				$('#modal .answer-name').datepicker();
			}
			$(modal).modal();
		},
		add_answer: function(e) {
			var self = this;
			var name = $(e.target).parent().find('input').val();
			if(name == '') return;
			var index = $(e.target).attr('data-index');
			var model = self.options.questions.where({index: parseInt(index)});
			model = model[0];
			model.get('answers').add_item({name: name, p_index: model.get('index')});

		},
		render_answers: function(model, collection) {
			var self = this;

			self.$el.find('#modal .answers-list tbody').html('');
			collection.forEach(function(model, index) {
				var icon_class ='';
				var el = self.answer_template({
					index_answer: index, 
					index_question: model.get('p_index'), 
					name: model.get('name'),
				});
				self.$el.find('#modal .answers-list tbody').append(el);
			});
		},
		delete_answer: function(e) {
			var self = this;
			var p_index = $(e.target).closest('tr').attr('data-index-question');
			var model = self.options.questions.where({index: parseInt(p_index)});
			model = model[0];
			var index = $(e.target).closest('tr').attr('data-index-answer');
			model.get('answers').delete_item(index);
		},
		save_event: function() {
			var self = this;
			var json = self.options.questions.toJSON();
			$.each(json, function(index, value) {
				json[index].answers = json[index].answers.toJSON();
			});
			var users = self.options.users.toJSON();
			var usr_arr = [];
			$.each(users, function(i,val){
				usr_arr.push(val.mail);
			});
			var data = {
				questions: json,
				users: usr_arr,
				timestamp: new Date().getTime()
			};
			// ajax
			$.post('/addevent/', {json: JSON.stringify(data)}).done(function(msg) {
				console.log(msg);
				window.location = msg['url'];
			}).fail(function(msg) {
				console.log(msg);
			});
		},
		add_user_select: function() {
			var self = this;
			var mail = $('select.user-mail option:selected').text();
			if(mail == '') return;
			self.options.users.add_item({
				mail: mail, 
			});
		},
        add_user_input: function() {
            var self = this;
            var mail = $('input.user-mail').val();
            if(mail == '') return;
            self.options.users.add_item({
                mail: mail,
            });
        },
		render_user: function(model, collection) {
			var self = this;

			self.$el.find('.users-list tbody').html('');
			collection.forEach(function(model, index) {
				var icon_class ='';
				var el = self.answer_template({
					index_answer: index, 
					index_question: 0, 
					name: model.get('mail'),
				});
				self.$el.find('.users-list tbody').append(el);
			});
		},
		delete_user: function(e) {
			var self = this;
			var index = $(e.target).closest('tr').attr('data-index-answer');
			self.options.users.delete_item(index);
		},
		
	});

	var questions_view = new QuestionsView({questions: question_collection, users: users_collection});

});