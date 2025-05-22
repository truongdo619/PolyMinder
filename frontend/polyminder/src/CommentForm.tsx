import React, { useState } from "react";

interface CommentFormProps {
  onSubmit: (input: string) => void;
  placeHolder?: string;
}

const CommentForm = ({ onSubmit, placeHolder }: CommentFormProps) => {
  const [input, setInput] = useState<string>("");

  return (
    <form
      className="Tip__card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(input);
      }}
    >
      <div>
        <label htmlFor="comment">Choose a label:</label>
        <select
          id="comment"
          name="comment"
          value={input} // Set the value of the select to be the state
          onChange={(event) => {
            setInput(event.target.value);
          }}
        >
          <option value="">Please select</option> {/* Explicit placeholder option */}
          <option value="INORGANIC">INORGANIC</option>
          <option value="REF_EXP">REF_EXP</option>
          <option value="CONDITION">CONDITION</option>
          <option value="MATERIAL_AMOUNT">MATERIAL_AMOUNT</option>
          <option value="ORGANIC">ORGANIC</option>
          <option value="POLYMER">POLYMER</option>
          <option value="PROP_NAME">PROP_NAME</option>
          <option value="CHAR_METHOD">CHAR_METHOD</option>
          <option value="POLYMER_FAMILY">POLYMER_FAMILY</option>
          <option value="PROP_VALUE">PROP_VALUE</option>
          <option value="MONOMER">MONOMER</option>
          <option value="OTHER_MATERIAL">OTHER_MATERIAL</option>
          <option value="COMPOSITE">COMPOSITE</option>
          <option value="SYN_METHOD">SYN_METHOD</option>
        </select>
      </div>
      <div>
        <input type="submit" value="Save" />
      </div>
    </form>
  );
};

export default CommentForm;
