import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import uniqueValidator from "mongoose-unique-validator";

export interface IUser extends Document {
    username: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, "username is required"],
            unique: true,
            trim: true,
            minlength: [3, "username must be 3 characters long"],
        },
        password: {
            type: String,
            required: [true, "password is required"],
            minlength: [6, "password must be 6 characters long"],
        },
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(uniqueValidator, { message: "{PATH} already exists" });

userSchema.pre<IUser>("save", async function () {
    if (!this.isModified("password")) {
        return
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err: any) {
        throw err
    }
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;