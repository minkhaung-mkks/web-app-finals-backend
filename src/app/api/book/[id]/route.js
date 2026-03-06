// TODO: Students must implement CRUD for Book here, similar to Item.
// Example: GET (get book by id), PATCH (update), DELETE (remove)
import {requireRole} from '@/lib/auth.js'
import  corsHeaders  from '@/lib/cors.js'
import { NextResponse } from 'next/server';
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';
// import necessary modules and setup as in Item

export async function OPTIONS(req) {
  return new Response(null, {
      status: 200,
      headers: corsHeaders,
  });
}

export async function GET(req, { params }) {
    // TODO: Implement get book by id
  const { error, status } = requireRole(req, "user","admin");
  if (error) return NextResponse.json({ message: error }, { status, headers: corsHeaders });
  const { id } = await params;

  try {
      const client = await getClientPromise();
      const db = client.db("final-01");
      const result = await db.collection("book").findOne({ _id: new ObjectId(id) });
      console.log("==> result", result);
      return NextResponse.json(result, {
          headers: corsHeaders
      });
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

export async function PATCH(req, { params }) {
  const { error, status } = requireRole(req, "admin");

  if (error) {
    return NextResponse.json(
      { message: error },
      { status, headers: corsHeaders }
    );
  }

  try {
    const { id } = await params;
    const data = await req.json();
    const partialUpdate = {};

    if (data.title != null) partialUpdate.Title = data.title;
    if (data.author != null) partialUpdate.Author = data.author;
    if (data.quantity != null) partialUpdate.Quantity = Number(data.quantity);
    if (data.location != null) partialUpdate.Location = data.location;
    if (data.status != null) partialUpdate.Status = data.status;

    const client = await getClientPromise();
    const db = client.db("final-01");

    const existedData = await db.collection("book").findOne({
      _id: new ObjectId(id)
    });

    if (!existedData) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const updatedResult = await db.collection("book").updateOne(
      { _id: new ObjectId(id) },
      { $set: partialUpdate }
    );

    let borrowRequestUpdateResult = null;

    const finalQuantity =
      data.quantity != null ? Number(data.quantity) : existedData.Quantity;
    console.log("final quantity",finalQuantity)
    if (finalQuantity <= 0) {
      console.log("Deleteing this shit")
      borrowRequestUpdateResult = await db.collection("borrow-request").updateMany(
        {
          BookId: id,
          RequestStatus: { $ne: "CLOSE-NO-AVAILABLE-BOOK" }
        },
        {
          $set: { RequestStatus: "CLOSE-NO-AVAILABLE-BOOK" }
        }
      );
      console.log(borrowRequestUpdateResult)
    }

    return NextResponse.json(
      {
        message: "Book updated successfully",
        matchedCount: updatedResult.matchedCount,
        modifiedCount: updatedResult.modifiedCount,
        borrowRequestsUpdated: borrowRequestUpdateResult
          ? borrowRequestUpdateResult.modifiedCount
          : 0
      },
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (exception) {
    console.log(exception);

    return NextResponse.json(
      { message: exception.toString() },
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }
}


export async function DELETE(req, { params }) {
    // TODO: Implement delete book by id
  const { error, status } = requireRole(req, "admin");
  console.log("Reached")
  if (error) return NextResponse.json({ message: error }, { status, headers: corsHeaders });
  const { id } = await params;
  try {
      const client = await getClientPromise();
      const db = client.db("final-01");
      const updatedResult = await db.collection("book").updateOne(
        { _id: new ObjectId(id) },
        { $set: { Status: "DELETED" } }
      );
  
      if (updatedResult.matchedCount === 0) {
        return NextResponse.json(
          { message: "Book not found" },
          { status: 404, headers: corsHeaders }
        );
      }
  
      return NextResponse.json(
        {
          message: "Book marked as deleted",
          matchedCount: updatedResult.matchedCount,
          modifiedCount: updatedResult.modifiedCount
        },
        {
          status: 200,
          headers: corsHeaders
        }
      );
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

