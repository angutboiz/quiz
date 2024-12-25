"use client";
import { GET_API_WITHOUT_COOKIE } from "@/lib/fetchAPI";
import React, { useEffect, useState } from "react";
import CQuizDetail from "@/components/CQuizDetail";
import { useSearchParams } from "next/navigation";
export default function NganHangDeCuong({ params }) {
    const [subject, setSubject] = useState([]);
    const searchParams = useSearchParams();
    const limit = searchParams.get("limit");
    useEffect(() => {
        const fetch = async () => {
            const req = await GET_API_WITHOUT_COOKIE(`/quiz/documentbank?limit=${limit}`);

            setSubject(req.questions);
        };
        fetch();
    }, []);

    console.log(subject);

    return (
        <div className="text-third">
            <CQuizDetail QuestData={subject} />
        </div>
    );
}