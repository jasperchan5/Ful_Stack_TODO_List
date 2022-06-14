import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const TodoSchema = new Schema({
    id: {
        type: Number,
        required: [true, 'id field is required']
    },
    text: {
        type: String,
        required: [true, 'Text field is required']
    },
    isDone: {
        type: Boolean,
        required: [true, 'isDone field is required']
    }
});

const Todo = mongoose.model('todos',TodoSchema);

export default Todo;