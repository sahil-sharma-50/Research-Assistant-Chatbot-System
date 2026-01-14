import React from 'react';

const ChatForm = () => {
  return (
    <div class="row">
        <div class="col-sm-1"></div>
    <div className="col-sm-10 formDiv">
      <input type="text"
        style={{ width: '100%'}}
        className="formControl"
        placeholder="Ask me anything..."
      />
    </div>
    <div class="col-sm-1"></div>
    </div>
    
  );
};

export default ChatForm;