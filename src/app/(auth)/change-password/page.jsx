"use client";
import React, { useEffect } from "react";
import Swal from "sweetalert2";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { POST_API } from "@/lib/fetchAPI";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
export default function ChangePassword() {
    const router = useRouter();
    const token = Cookies.get("token");
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        if (token === undefined) {
            Swal.fire({
                title: "Bạn chưa đăng nhập",
                text: "Vui lòng đăng nhập để thay đổi mật khẩu",
                icon: "warning",
                didClose: () => {
                    router.push("/login");
                },
            });
        }
    }, []);

    const formik = useFormik({
        initialValues: {
            old_password: "",
            new_password: "",
            re_new_password: "",
        },
        validationSchema: Yup.object({
            old_password: Yup.string().required("Vui lòng nhập mật khẩu cũ").min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
            new_password: Yup.string().required("Vui lòng nhập mật khẩu mới").min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
            re_new_password: Yup.string()
                .oneOf([Yup.ref("new_password"), null], "Mật khẩu không khớp")
                .required("Vui lòng nhập lại mật khẩu mới"),
        }),
        onSubmit: (values) => {
            setLoading(true);
            fetchChangePassword(values);
        },
    });

    const fetchChangePassword = async (values) => {
        const res = await POST_API("/auth/change-password", values, "POST", token);
        const data = await res.json();
        if (res.ok) {
            Swal.fire({
                title: "Thành công",
                text: data.message,
                icon: "success",
                willClose: () => {
                    router.push("/");
                },
            });
        } else {
            Swal.fire({
                title: "Thất bại",
                text: data.message,
                icon: "error",
            });
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center flex-col items-center">
            <div className="w-full mt-10 md:mt-0 md:w-[500px] border-[1px] border-green-500 px-3 md:px-10 py-5 rounded-lg shadow-lg bg-white">
                <form onSubmit={formik.handleSubmit}>
                    <h1 className="text-2xl font-bold text-green-500 text-center mb-5">Cập nhật mật khẩu</h1>
                    <div className="mb-3">
                        <label htmlFor="old_password" className="block">
                            Nhập mật khẩu cũ của bạn
                        </label>
                        <input
                            type="old_password"
                            placeholder="Nhập mật khẩu cũ của bạn..."
                            name="old_password"
                            id="old_password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.old_password}
                        />
                        {formik.touched.old_password && formik.errors.old_password ? <div className="text-red-500">{formik.errors.old_password}</div> : null}{" "}
                    </div>
                    <div className="mb-3">
                        <label htmlFor="new_password" className="block">
                            Nhập mật khẩu mới
                        </label>
                        <input
                            type="new_password"
                            placeholder="Nhập mật khẩu mới của bạn..."
                            name="new_password"
                            id="new_password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.new_password}
                        />
                        {formik.touched.new_password && formik.errors.new_password ? <div className="text-red-500">{formik.errors.new_password}</div> : null}{" "}
                    </div>
                    <div className="mb-3">
                        <label htmlFor="re_new_password" className="block">
                            Nhập lại mật khẩu mới
                        </label>
                        <input
                            type="re_new_password"
                            placeholder="Nhập lại mật khẩu mới của bạn..."
                            name="re_new_password"
                            id="re_new_password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.re_new_password}
                        />
                        {formik.touched.re_new_password && formik.errors.re_new_password ? <div className="text-red-500">{formik.errors.re_new_password}</div> : null}{" "}
                    </div>
                    <div className="mb-5">
                        <button type="submit" className="bg-green-500 text-white  w-full flex gap-5 items-center justify-center" disabled={loading}>
                            {loading && <Spin indicator={<LoadingOutlined spin />} size="default" />}
                            Thay đổi mật khẩu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
