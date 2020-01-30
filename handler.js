'use strict';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10'});
const uuid = require('uuid/v4');
const postsTable = process.env.POSTS_TABLE;

function response(statusCode,message){
	return {
	  statusCode: statusCode,
	  body: JSON.stringify(message)
	};
}

function sortByDate(a,b){
	if(a.createdAt > b.createdAt){
		return -1;
	} else return 1;
	
}

module.exports.createPost = (event,context,callback) => {
  const reqBody = JSON.parse(event.body);
  
  if(!reqBody.name || reqBody.name.trim() === '' ||!reqBody.phoneNumber || reqBody.phoneNumber.trim() === '' ||!reqBody.emailId || reqBody.emailId.trim() === ''){
	  return callback(null,response(400,{error: 'post must have name, phoneNumber and emailId cannot be empty'}))
//  if(!reqBody.title || reqBody.title.trim() === '' || !reqBody.body || reqBody.body.trim() === ''){
//	  return callback(null,response(400,{error: 'post must have title and body cannot be empty'}))
  }
  const post = {
		  
		  id: uuid(),
		  createdAt: new Date().toISOString(),
//		  userId: 1,
//		  titleId: reqBody.title,
//		  body: reqBody.body		  
		  memberId: uuid(),
		  name: reqBody.name,
		  phoneNumber: reqBody.phoneNumber,
		  emailId: reqBody.emailId
   };
  return db.put({
	  TableName: postsTable,
	  Item: post  
  }).promise().then(() => {
	  callback(null,response(201,post))
}) 
 .catch(err => response(null,response(err.statusCode,err)));
}

////////////// getAllPosts //////////////

module.exports.getAllPosts = (event,context,callback) => {
	  return db.scan({
		  TableName: postsTable,
	  }).promise().then(res => {
		  callback(null,response(201,res.Items.sort(sortByDate)))
	})
	    .catch(err => response(null,response(err.statusCode,err)));
}


///////// getSinglePost ////////////////

module.exports.getPost = (event,context,callback) => {
//	const id = event.pathparameters.id;
	
	const params ={
			Key: {
			      id: event.pathParameters.id,
			    },
		 TableName: postsTable,
	}
	  return db.get(params).promise()
	    .then(res => {
		  if(res.Item)callback(null,response(200,res.Item))
		  else callback(null,response(404,{error: 'post not found'}))
	})
	.catch(err => response(null,response(err.statusCode,err)));  
	
}


///////// getNumberOfPosts /////////
module.exports.getPosts = (events,context,callback) => {
	const numberOfPosts = events.pathParameters.number;
	const params = {
			TableName: postsTable,
			Limit: numberOfPosts
	};
	return db.scan(params)
	  .promise()
	  .then(res => {
		callback(null,response(200,res.Items.sort(sortByDate)))
	}).catch(err => response(null,response(err.statusCode,err)));
} 

//////// Update a post //////////
module.exports.updatePost = (event,context,callback) => {
//	const id = event.pathParmeters.id;
	const body = JSON.parse(event.body);
	const paramName = body.paramName;
	const paramValue = body.paramValue;
	
	const params = {
			Key: {
			      id: event.pathParameters.id,
			    },
			TableName: postsTable,
			ConditExpression: 'attribute_exists(id)',
			UpdateExpression: 'set ' + paramName + '= :v',
			ExpressionAttributeValues: {
					':v': paramValue
			},
			ReturnValue: 'ALL_NEW'
	};
	
	return db.update(params)
	 .promise()
	 .then(res => {
		 callback(null,response(200,res))
	 })
	  .catch(err => callback(null, response(err.statusCode,err)))
}

//Delete a post
module.exports.deletePost = (event, context, callback) => {
//	const id = event.pathParameters.id;
	const params = {
			Key: {
			      id: event.pathParameters.id,
			    },
			TableName: postsTable
	};
	return db.delete(params)
	 .promise()
	 .then(() => callback(null, response(200, { message: 'post deleted successfully' })))
	 .catch(err => callback(null, response(err.statusCode, err)));
	
}