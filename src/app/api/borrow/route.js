
import { requireRole } from '@/lib/auth.js'
import corsHeaders from '@/lib/cors.js'
import { NextResponse } from 'next/server';
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';


export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
export async function POST(req) {
  // TODO: Implement create a new request
  const { error, status } = requireRole(req, "user", "admin");
  if (error) return NextResponse.json({ message: error }, { status, headers: corsHeaders });
  const data = await req.json();
  const borrower = data.userId;
  const targetBook = data.bookId;
  const pickupDate = data.pickupDate
  const createdAt = new Date().toISOString();
  try {
    const client = await getClientPromise();
    const db = client.db("final-01");
    const result = await db.collection("borrow-request").insertOne({
      UserID: borrower,
      BookID: targetBook,
      RequestStatus: "INIT",
      TargetDate: pickupDate,
      CreatedAt: createdAt
    });
    return NextResponse.json({
      id: result.insertedId
    }, {
      status: 200,
      headers: corsHeaders
    })
  }
  catch (exception) {
    console.log("exception", exception.toString());
    const errorMsg = exception.toString();
    return NextResponse.json({
      message: errorMsg
    }, {
      status: 400,
      headers: corsHeaders
    })
  }
}
export async function PATCH(req) {
  const { user,error, status } = requireRole(req, "admin", "user");
  if (error) {
    return NextResponse.json(
      { message: error },
      { status, headers: corsHeaders }
    );
  }

  try {
    const data = await req.json();
    const id = data.id;

    if (!id) {
      return NextResponse.json(
        { message: "Missing id" },
        { status: 400, headers: corsHeaders }
      );
    }

    const partialUpdate = {};

    if (data.requestStatus != null) partialUpdate.RequestStatus = data.requestStatus;
    if(user.role == "USER" && data.requestStatus != "CANCEL-USER"){
      console.log('this was triggered')
      return NextResponse.json(
        { message: "You don't have permission for this request Status" },
        { status: 403, headers: corsHeaders }
      );
    }
    const client = await getClientPromise();
    const db = client.db("final-01");

    const existedData = await db.collection("borrow-request").findOne({
      _id: new ObjectId(id)
    });

    if (!existedData) {
      return NextResponse.json(
        { message: "borrow-request not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const updatedResult = await db.collection("borrow-request").updateOne(
      { _id: new ObjectId(id) },
      { $set: partialUpdate }
    );

    return NextResponse.json(
      {
        message: "borrow-request updated successfully",
        matchedCount: updatedResult.matchedCount,
        modifiedCount: updatedResult.modifiedCount
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (exception) {
    return NextResponse.json(
      { message: exception.toString() },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function GET(req) {
  // TODO: Implement list existing request
  const { user,error, status } = requireRole(req, "admin", "user");
  if (error) return NextResponse.json({ message: error }, { status, headers: corsHeaders });
  try {

    const client = await getClientPromise();
    const db = client.db("final-01");
    let results;
    if(user.role === "ADMIN"){
      results = await db.collection("borrow-request")
        .find({})
        .toArray();
    } else {
      results = await db.collection("borrow-request")
        .find({ UserID: user.id })
        .toArray();
    }
    return NextResponse.json({
      items: results,
    }, {
      headers: corsHeaders
    })
  }
  catch (exception) {
    console.log("exception", exception.toString());
    const errorMsg = exception.toString();
    return NextResponse.json({
      message: errorMsg
    }, {
      status: 400,
      headers: corsHeaders
    })
  }
}
